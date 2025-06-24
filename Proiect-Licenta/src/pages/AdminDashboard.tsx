import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  onSnapshot, 
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { 
  Check, 
  X, 
  AlertTriangle, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Tag, 
  Mail, 
  Phone, 
  Image, 
  RefreshCw, 
  Users, 
  Trash2, 
  Eye, 
  Star, 
  Heart,
  TrendingUp,
  Activity,
  UserPlus,
  Package,
  BarChart3,
  Clock
} from 'lucide-react';
import type { ServiceApprovalRequest, Event } from '../types';

interface ApprovedVendor {
  id: string;
  nume: string;
  email: string;
  rol: string;
  creat_la: Date;
  services: Event[];
}

interface DashboardMetrics {
  pendingRequests: number;
  newUsers: number;
  activeServices: number;
  totalVendors: number;
}

interface ActivityItem {
  id: string;
  type: 'user_registered' | 'service_added' | 'service_approved';
  message: string;
  timestamp: Date;
  userName?: string;
  serviceName?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'approved-vendors' | 'analytics'>('dashboard');
  const [requests, setRequests] = useState<ServiceApprovalRequest[]>([]);
  const [approvedVendors, setApprovedVendors] = useState<ApprovedVendor[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    pendingRequests: 0,
    newUsers: 0,
    activeServices: 0,
    totalVendors: 0
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceApprovalRequest | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<ApprovedVendor | null>(null);
  const [selectedService, setSelectedService] = useState<Event | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const [isDeleteVendorModalOpen, setIsDeleteVendorModalOpen] = useState(false);
  const [isDeleteServiceModalOpen, setIsDeleteServiceModalOpen] = useState(false);
  const [isVendorServicesModalOpen, setIsVendorServicesModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [indexError, setIndexError] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState(false);
  const [deletingService, setDeletingService] = useState(false);

  useEffect(() => {
    if (!currentUser || userData?.rol !== 'admin') {
      navigate('/');
      return;
    }

    console.log('Admin Dashboard: Setting up real-time listener for service approval requests');
    fetchDashboardData();
  }, [currentUser, userData, navigate]);

  useEffect(() => {
    if (activeTab === 'approved-vendors') {
      fetchApprovedVendors();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      console.log('Admin Dashboard: Fetching dashboard data...');
      setLoading(true);
      setError(null);
      setIndexError(false);

      if (!currentUser || userData?.rol !== 'admin') {
        console.log('Admin Dashboard: User is not admin, redirecting...');
        navigate('/');
        return;
      }

      // Fetch pending requests
      await fetchRequests();
      
      // Fetch metrics
      await fetchMetrics();
      
      // Fetch recent activity
      await fetchRecentActivity();

    } catch (error) {
      console.error('Admin Dashboard: Error fetching dashboard data:', error);
      setError(`Eroare la încărcarea datelor: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const requestsRef = collection(db, 'service_approval_requests');

      try {
        const indexedQuery = query(
          requestsRef,
          where('status', '==', 'pending'),
          orderBy('createdAt', 'desc')
        );
        
        const snapshot = await getDocs(indexedQuery);
        console.log(`Admin Dashboard: Retrieved ${snapshot.docs.length} requests using indexed query`);

        const requestsData = snapshot.docs.map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            service: {
              ...data.service,
              date: data.service?.date?.toDate() || new Date()
            }
          } as ServiceApprovalRequest;
        });

        setRequests(requestsData);

      } catch (indexError) {
        console.log('Admin Dashboard: Index error detected, falling back to simple query:', indexError);
        setIndexError(true);
        
        const simpleQuery = query(requestsRef, where('status', '==', 'pending'));
        const snapshot = await getDocs(simpleQuery);
        console.log(`Admin Dashboard: Retrieved ${snapshot.docs.length} requests using simple query`);

        let requestsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            service: {
              ...data.service,
              date: data.service?.date?.toDate() || new Date()
            }
          } as ServiceApprovalRequest;
        });

        requestsData = requestsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRequests(requestsData);
      }

    } catch (error) {
      console.error('Admin Dashboard: Error fetching requests:', error);
      setError(`Eroare la încărcarea cererilor: ${error.message}`);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Get pending requests count
      const pendingRequestsRef = collection(db, 'service_approval_requests');
      const pendingQuery = query(pendingRequestsRef, where('status', '==', 'pending'));
      const pendingSnapshot = await getDocs(pendingQuery);

      // Get new users (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const usersRef = collection(db, 'utilizatori');
      const usersSnapshot = await getDocs(usersRef);
      const newUsersCount = usersSnapshot.docs.filter(doc => {
        const userData = doc.data();
        const createdAt = userData.creat_la?.toDate();
        return createdAt && createdAt >= weekAgo;
      }).length;

      // Get active services
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      const activeServicesCount = eventsSnapshot.docs.filter(doc => {
        const eventData = doc.data();
        return eventData.status === 'active' || !eventData.status; // Default to active if no status
      }).length;

      // Get total vendors
      const vendorsQuery = query(usersRef, where('rol', '==', 'furnizor'));
      const vendorsSnapshot = await getDocs(vendorsQuery);

      setMetrics({
        pendingRequests: pendingSnapshot.docs.length,
        newUsers: newUsersCount,
        activeServices: activeServicesCount,
        totalVendors: vendorsSnapshot.docs.length
      });

    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const activities: ActivityItem[] = [];

      // Get recent users (last 10)
      const usersRef = collection(db, 'utilizatori');
      const usersSnapshot = await getDocs(usersRef);
      const recentUsers = usersSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          creat_la: doc.data().creat_la?.toDate()
        }))
        .filter(user => user.creat_la)
        .sort((a, b) => b.creat_la.getTime() - a.creat_la.getTime())
        .slice(0, 5);

      recentUsers.forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'user_registered',
          message: `${user.nume} s-a înregistrat ca ${user.rol}`,
          timestamp: user.creat_la,
          userName: user.nume
        });
      });

      // Get recent services (last 10)
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      const recentServices = eventsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }))
        .filter(service => service.createdAt)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      recentServices.forEach(service => {
        activities.push({
          id: `service_${service.id}`,
          type: 'service_added',
          message: `Serviciu nou adăugat: "${service.name}"`,
          timestamp: service.createdAt,
          serviceName: service.name
        });
      });

      // Sort all activities by timestamp
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const fetchApprovedVendors = async () => {
    try {
      setLoadingVendors(true);
      setError(null);

      const usersRef = collection(db, 'utilizatori');
      const vendorsQuery = query(usersRef, where('rol', '==', 'furnizor'));
      const vendorsSnapshot = await getDocs(vendorsQuery);

      const vendorsData: ApprovedVendor[] = [];

      for (const vendorDoc of vendorsSnapshot.docs) {
        const vendorData = vendorDoc.data();
        
        const eventsRef = collection(db, 'events');
        const eventsQuery = query(eventsRef, where('userId', '==', vendorDoc.id));
        const eventsSnapshot = await getDocs(eventsQuery);

        const services = eventsSnapshot.docs.map(eventDoc => ({
          id: eventDoc.id,
          ...eventDoc.data(),
          date: eventDoc.data().date?.toDate() || new Date(),
          createdAt: eventDoc.data().createdAt?.toDate() || new Date()
        })) as Event[];

        if (services.length > 0) {
          vendorsData.push({
            id: vendorDoc.id,
            nume: vendorData.nume || 'Nume necunoscut',
            email: vendorData.email || 'Email necunoscut',
            rol: vendorData.rol || 'furnizor',
            creat_la: vendorData.creat_la?.toDate() || new Date(),
            services
          });
        }
      }

      vendorsData.sort((a, b) => b.services.length - a.services.length);
      setApprovedVendors(vendorsData);

    } catch (error) {
      console.error('Error fetching approved vendors:', error);
      setError('A apărut o eroare la încărcarea furnizorilor aprobați');
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleDeleteVendor = async (vendor: ApprovedVendor) => {
    try {
      setDeletingVendor(true);

      for (const service of vendor.services) {
        await deleteDoc(doc(db, 'events', service.id));
      }

      const approvalRequestsRef = collection(db, 'service_approval_requests');
      const approvalQuery = query(approvalRequestsRef, where('vendorId', '==', vendor.id));
      const approvalSnapshot = await getDocs(approvalQuery);
      
      for (const requestDoc of approvalSnapshot.docs) {
        await deleteDoc(doc(db, 'service_approval_requests', requestDoc.id));
      }

      const requestsRef = collection(db, 'requests');
      const requestsQuery = query(requestsRef, where('vendorId', '==', vendor.id));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      for (const requestDoc of requestsSnapshot.docs) {
        await deleteDoc(doc(db, 'requests', requestDoc.id));
      }

      const confirmedEventsRef = collection(db, 'confirmed_events');
      const confirmedQuery = query(confirmedEventsRef, where('vendorId', '==', vendor.id));
      const confirmedSnapshot = await getDocs(confirmedQuery);
      
      for (const eventDoc of confirmedSnapshot.docs) {
        await deleteDoc(doc(db, 'confirmed_events', eventDoc.id));
      }

      await deleteDoc(doc(db, 'utilizatori', vendor.id));

      setApprovedVendors(prev => prev.filter(v => v.id !== vendor.id));
      setIsDeleteVendorModalOpen(false);
      setSelectedVendor(null);

      // Refresh metrics
      await fetchMetrics();

      console.log(`Vendor ${vendor.nume} and all associated data deleted successfully`);

    } catch (error) {
      console.error('Error deleting vendor:', error);
      setError('A apărut o eroare la ștergerea furnizorului');
    } finally {
      setDeletingVendor(false);
    }
  };

  const handleDeleteService = async (service: Event) => {
    try {
      setDeletingService(true);

      // Delete the service
      await deleteDoc(doc(db, 'events', service.id));

      // Delete related requests
      const requestsRef = collection(db, 'requests');
      const requestsQuery = query(requestsRef, where('eventId', '==', service.id));
      const requestsSnapshot = await getDocs(requestsQuery);
      
      for (const requestDoc of requestsSnapshot.docs) {
        await deleteDoc(doc(db, 'requests', requestDoc.id));
      }

      // Delete related confirmed events
      const confirmedEventsRef = collection(db, 'confirmed_events');
      const confirmedQuery = query(confirmedEventsRef, where('eventId', '==', service.id));
      const confirmedSnapshot = await getDocs(confirmedQuery);
      
      for (const eventDoc of confirmedSnapshot.docs) {
        await deleteDoc(doc(db, 'confirmed_events', eventDoc.id));
      }

      // Update vendor's services list
      setApprovedVendors(prev => prev.map(vendor => ({
        ...vendor,
        services: vendor.services.filter(s => s.id !== service.id)
      })));

      setIsDeleteServiceModalOpen(false);
      setSelectedService(null);

      // Refresh metrics
      await fetchMetrics();

      console.log(`Service ${service.name} and all associated data deleted successfully`);

    } catch (error) {
      console.error('Error deleting service:', error);
      setError('A apărut o eroare la ștergerea serviciului');
    } finally {
      setDeletingService(false);
    }
  };

  const refreshRequests = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const refreshVendors = async () => {
    setRefreshing(true);
    await fetchApprovedVendors();
    setRefreshing(false);
  };

  const handleApprove = async (request: ServiceApprovalRequest) => {
    try {
      console.log('Admin Dashboard: Approving request:', request.id);
      const timestamp = serverTimestamp();
      
      const requestRef = doc(db, 'service_approval_requests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        adminFeedback: feedback,
        updatedAt: timestamp
      });

      const eventRef = doc(collection(db, 'events'));
      await setDoc(eventRef, {
        ...request.service,
        userId: request.vendorId,
        furnizor: request.vendorName,
        numarTelefon: request.vendorPhone,
        email: request.vendorEmail,
        createdAt: timestamp,
        updatedAt: timestamp,
        status: 'active'
      });

      const vendorRef = doc(db, 'utilizatori', request.vendorId);
      const vendorDoc = await getDoc(vendorRef);
      if (vendorDoc.exists()) {
        const notifications = vendorDoc.data().notifications || [];
        const newNotification = {
          type: 'service_approved',
          message: `Serviciul "${request.service.name}" a fost aprobat${feedback ? `: ${feedback}` : ''}`,
          createdAt: new Date().toISOString(),
          read: false
        };
        
        await updateDoc(vendorRef, {
          notifications: [newNotification, ...notifications]
        });
      }

      setRequests(prev => prev.filter(r => r.id !== request.id));
      setIsModalOpen(false);
      setSelectedRequest(null);
      setFeedback('');

      // Refresh metrics
      await fetchMetrics();
      
      console.log('Admin Dashboard: Request approved successfully');
    } catch (error) {
      console.error('Admin Dashboard: Error approving request:', error);
      setError('A apărut o eroare la aprobarea cererii');
    }
  };

  const handleReject = async (request: ServiceApprovalRequest) => {
    try {
      console.log('Admin Dashboard: Rejecting request:', request.id);
      const timestamp = serverTimestamp();
      
      const requestRef = doc(db, 'service_approval_requests', request.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        adminFeedback: feedback,
        updatedAt: timestamp
      });

      const vendorRef = doc(db, 'utilizatori', request.vendorId);
      const vendorDoc = await getDoc(vendorRef);
      if (vendorDoc.exists()) {
        const notifications = vendorDoc.data().notifications || [];
        const newNotification = {
          type: 'service_rejected',
          message: `Serviciul "${request.service.name}" a fost respins${feedback ? `: ${feedback}` : ''}`,
          createdAt: new Date().toISOString(),
          read: false
        };
        
        await updateDoc(vendorRef, {
          notifications: [newNotification, ...notifications]
        });
      }

      setRequests(prev => prev.filter(r => r.id !== request.id));
      setIsModalOpen(false);
      setSelectedRequest(null);
      setFeedback('');

      // Refresh metrics
      await fetchMetrics();
      
      console.log('Admin Dashboard: Request rejected successfully');
    } catch (error) {
      console.error('Admin Dashboard: Error rejecting request:', error);
      setError('A apărut o eroare la respingerea cererii');
    }
  };

  const handleViewVendorServices = (vendor: ApprovedVendor) => {
    setSelectedVendor(vendor);
    setIsVendorServicesModalOpen(true);
  };

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panou de Administrare</h1>
            <p className="mt-2 text-gray-600">Gestionează cererile de aprobare și furnizorii platformei</p>
          </div>
          <Button
            variant="outline"
            onClick={activeTab === 'pending' ? refreshRequests : 
                     activeTab === 'approved-vendors' ? refreshVendors : 
                     refreshRequests}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Reîmprospătează
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'pending'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5 mr-2" />
            Cereri în Așteptare ({requests.length})
          </button>
          
          <button
            onClick={() => setActiveTab('approved-vendors')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'approved-vendors'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5 mr-2" />
            Furnizori Aprobați ({approvedVendors.length})
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Analiză
          </button>
        </div>

        {indexError && activeTab === 'pending' && (
          <div className="mb-6 bg-yellow-50 text-yellow-800 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Index Firestore lipsă</p>
                <p className="text-sm mt-1">
                  Pentru performanță optimă, este necesar să creezi un index compus în Firebase Console.
                </p>
                <a
                  href="https://console.firebase.google.com/v1/r/project/eventoria-app/firestore/indexes?create_composite=Cl9wcm9qZWN0cy9ldmVudG9yaWEtYXBwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9zZXJ2aWNlX2FwcHJvdmFsX3JlcXVlc3RzL2luZGV4ZXMvXxABGgoKBnN0YXR1cxABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm hover:bg-yellow-200"
                >
                  Creează index în Firebase Console
                </a>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-lg">
            <p className="font-medium">Eroare:</p>
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={activeTab === 'pending' ? refreshRequests : 
                       activeTab === 'approved-vendors' ? refreshVendors : 
                       refreshRequests}
              className="mt-2"
              size="sm"
            >
              Încearcă din nou
            </Button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Cereri în așteptare</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.pendingRequests}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Utilizatori noi (7 zile)</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.newUsers}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Servicii active</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.activeServices}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total furnizori</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics.totalVendors}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Activitate recentă</h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
              
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nu există activitate recentă</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'user_registered' ? 'bg-blue-100' :
                        activity.type === 'service_added' ? 'bg-green-100' :
                        'bg-amber-100'
                      }`}>
                        {activity.type === 'user_registered' && <UserPlus className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'service_added' && <Package className="w-4 h-4 text-green-600" />}
                        {activity.type === 'service_approved' && <Check className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.timestamp.toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Pending Requests Tab */}
        {activeTab === 'pending' && (
          <>
            {requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Nu există cereri de aprobare în așteptare</p>
                <Button
                  variant="outline"
                  onClick={refreshRequests}
                  className="mt-4"
                >
                  Verifică din nou
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map((request) => (
                  <Card key={request.id} className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h2 className="text-xl font-semibold">{request.service.name}</h2>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            În așteptare
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                            {request.service.locations.join(', ')}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                            {request.service.date.toLocaleDateString()}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <DollarSign className="w-5 h-5 mr-2 text-gray-400" />
                            {request.service.price.amount.toLocaleString('ro-RO')} RON
                            <span className="text-sm text-gray-500 ml-1">
                              {request.service.price.type === 'per_hour' && '/ oră'}
                              {request.service.price.type === 'per_person' && '/ persoană'}
                              {request.service.price.type === 'per_event' && '/ eveniment'}
                            </span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Tag className="w-5 h-5 mr-2 text-gray-400" />
                            {request.service.tags.join(', ')}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {request.vendorEmail}
                          </div>
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {request.vendorPhone}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsImagePreviewOpen(true);
                          }}
                          className="mt-4 flex items-center text-amber-600 hover:text-amber-700"
                        >
                          <Image className="w-4 h-4 mr-2" />
                          Vezi imaginea serviciului
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Aprobă
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsModalOpen(true);
                          }}
                        >
                          <X className="w-5 h-5 mr-2" />
                          Respinge
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Approved Vendors Tab */}
        {activeTab === 'approved-vendors' && (
          <>
            {loadingVendors ? (
              <div className="animate-pulse space-y-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : approvedVendors.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nu există furnizori aprobați încă</p>
              </div>
            ) : (
              <div className="space-y-6">
                {approvedVendors.map((vendor) => (
                  <Card key={vendor.id} className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <h2 className="text-xl font-semibold">{vendor.nume}</h2>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {vendor.services.length} servicii active
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-5 h-5 mr-2 text-gray-400" />
                            {vendor.email}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                            Înregistrat: {vendor.creat_la.toLocaleDateString('ro-RO')}
                          </div>
                        </div>

                        <div className="mb-4">
                          <h3 className="font-medium text-gray-900 mb-2">Servicii:</h3>
                          <div className="space-y-2">
                            {vendor.services.slice(0, 3).map((service) => (
                              <div key={service.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                                <div>
                                  <p className="font-medium text-gray-900">{service.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {service.price.amount.toLocaleString('ro-RO')} RON
                                    {service.price.type === 'per_hour' && ' / oră'}
                                    {service.price.type === 'per_person' && ' / persoană'}
                                    {service.price.type === 'per_event' && ' / eveniment'}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {service.locations.join(', ')}
                                </span>
                              </div>
                            ))}
                            {vendor.services.length > 3 && (
                              <p className="text-sm text-gray-500">
                                +{vendor.services.length - 3} servicii suplimentare
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleViewVendorServices(vendor)}
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Vezi detalii
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setIsDeleteVendorModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-5 h-5 mr-2" />
                          Șterge furnizor
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Vendors */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Furnizori</h3>
                <div className="space-y-4">
                  {approvedVendors.slice(0, 5).map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-amber-100 text-amber-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{vendor.nume}</p>
                          <p className="text-sm text-gray-500">{vendor.services.length} servicii</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {((vendor.services.length / metrics.activeServices) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">din total</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* User Distribution */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribuție utilizatori</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Furnizori</span>
                    <span className="font-medium">{metrics.totalVendors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Participanți</span>
                    <span className="font-medium">
                      {/* This would need to be calculated separately */}
                      -
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Utilizatori noi (7 zile)</span>
                    <span className="font-medium text-green-600">{metrics.newUsers}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Service Statistics */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Statistici servicii</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-600">{metrics.activeServices}</p>
                  <p className="text-sm text-gray-600">Servicii active</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{metrics.pendingRequests}</p>
                  <p className="text-sm text-gray-600">În așteptare</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {metrics.activeServices > 0 ? 
                      ((metrics.activeServices / (metrics.activeServices + metrics.pendingRequests)) * 100).toFixed(1) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Rata de aprobare</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {isImagePreviewOpen && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setIsImagePreviewOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="relative max-w-4xl w-full aspect-video bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedRequest.service.imageUrl}
                alt={selectedRequest.service.name}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setIsImagePreviewOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/75"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vendor Services Modal */}
      <AnimatePresence>
        {isVendorServicesModalOpen && selectedVendor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setIsVendorServicesModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedVendor.nume}</h2>
                    <p className="text-gray-600">{selectedVendor.services.length} servicii active</p>
                  </div>
                  <button
                    onClick={() => setIsVendorServicesModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedVendor.services.map((service) => (
                    <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <img
                          src={service.imageUrl}
                          alt={service.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setIsDeleteServiceModalOpen(true);
                            }}
                            className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors">
                            <Heart className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex flex-wrap gap-1 mb-3">
                          {service.subcategories?.map((subcategory, index) => (
                            <span key={index} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              {subcategory}
                            </span>
                          ))}
                        </div>

                        <h3 className="text-lg font-semibold mb-2 line-clamp-1">{service.name}</h3>
                        <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>

                        <div className="space-y-2 text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {service.locations.join(', ')}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {service.date.toLocaleDateString('ro-RO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-lg font-semibold text-amber-600">
                            {service.price.amount.toLocaleString('ro-RO')} RON
                            <span className="text-sm text-gray-500 ml-1">
                              {service.price.type === 'per_hour' && '/ oră'}
                              {service.price.type === 'per_person' && '/ persoană'}
                              {service.price.type === 'per_event' && '/ eveniment'}
                            </span>
                          </div>
                          <div className="flex items-center text-amber-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="ml-1 text-sm font-medium">4.8</span>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => navigate(`/eveniment/${service.id}`)}
                          >
                            Vezi detalii
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1"
                          >
                            Contactează
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {selectedVendor.services.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Acest furnizor nu are servicii active</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approval/Rejection Modal */}
      <AnimatePresence>
        {isModalOpen && selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6"
            >
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedRequest.service.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Furnizor: {selectedRequest.vendorName}
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback pentru furnizor
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  placeholder="Adaugă un mesaj pentru furnizor..."
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                    setFeedback('');
                  }}
                >
                  Anulează
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleApprove(selectedRequest)}
                >
                  Aprobă serviciul
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-50"
                  onClick={() => handleReject(selectedRequest)}
                >
                  Respinge serviciul
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Vendor Modal */}
      <AnimatePresence>
        {isDeleteVendorModalOpen && selectedVendor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirmare ștergere furnizor
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Ești sigur că vrei să ștergi furnizorul <strong>{selectedVendor.nume}</strong>? 
                Această acțiune va șterge:
              </p>
              <ul className="text-sm text-gray-600 mb-6 space-y-1">
                <li>• Toate serviciile furnizorului ({selectedVendor.services.length} servicii)</li>
                <li>• Toate cererile de aprobare</li>
                <li>• Toate cererile de la clienți</li>
                <li>• Toate evenimentele confirmate</li>
                <li>• Contul utilizatorului</li>
              </ul>
              <p className="text-sm text-red-600 text-center mb-6 font-medium">
                Această acțiune este permanentă și nu poate fi anulată!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteVendorModalOpen(false);
                    setSelectedVendor(null);
                  }}
                  disabled={deletingVendor}
                >
                  Anulează
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDeleteVendor(selectedVendor)}
                  disabled={deletingVendor}
                >
                  {deletingVendor ? 'Se șterge...' : 'Confirmă ștergerea'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Service Modal */}
      <AnimatePresence>
        {isDeleteServiceModalOpen && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirmare ștergere serviciu
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Ești sigur că vrei să ștergi serviciul <strong>{selectedService.name}</strong>? 
                Această acțiune va șterge și toate cererile și evenimentele confirmate asociate.
              </p>
              <p className="text-sm text-red-600 text-center mb-6 font-medium">
                Această acțiune este permanentă și nu poate fi anulată!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteServiceModalOpen(false);
                    setSelectedService(null);
                  }}
                  disabled={deletingService}
                >
                  Anulează
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleDeleteService(selectedService)}
                  disabled={deletingService}
                >
                  {deletingService ? 'Se șterge...' : 'Confirmă ștergerea'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;