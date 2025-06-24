import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, deleteDoc, doc, getDocs, query, where, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { Calendar, MapPin, PlusCircle, Trash2, AlertTriangle, Edit2, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '../ui/Input';
import { MultiSelect } from '../ui/MultiSelect';
import type { ServiceApprovalRequest } from '../../types';

interface Service {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  userId: string;
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  locations: string[];
  date: Date;
  createdAt: Date;
  status: 'active' | 'pending' | 'rejected';
}

interface ServicesTabProps {
  userId: string;
}

const CITIES = [
  'București',
  'Cluj-Napoca',
  'Timișoara',
  'Iași',
  'Constanța',
  'Craiova',
  'Brașov',
  'Galați',
  'Ploiești',
  'Oradea'
];

const PRICE_TYPES = [
  { value: 'per_hour', label: 'Per oră' },
  { value: 'per_event', label: 'Per eveniment' },
  { value: 'per_person', label: 'Per persoană' }
];

export const ServicesTab: React.FC<ServicesTabProps> = ({ userId }) => {
  const navigate = useNavigate();
  const [activeServices, setActiveServices] = useState<Service[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ServiceApprovalRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<ServiceApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'pending' | 'rejected'>('active');
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  const [requestToView, setRequestToView] = useState<ServiceApprovalRequest | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    price: {
      amount: 0,
      type: 'per_event' as 'per_hour' | 'per_event' | 'per_person'
    },
    locations: [] as string[],
    date: ''
  });

  useEffect(() => {
    const fetchActiveServices = async () => {
      try {
        const servicesRef = collection(db, 'events');
        const servicesQuery = query(servicesRef, where('userId', '==', userId));
        const snapshot = await getDocs(servicesQuery);
        
        const servicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          status: 'active'
        })) as Service[];

        setActiveServices(servicesData);
      } catch (error) {
        console.error('Error fetching active services:', error);
        setError('A apărut o eroare la încărcarea serviciilor active');
      }
    };

    // Set up real-time listener for service approval requests
    const requestsRef = collection(db, 'service_approval_requests');
    const requestsQuery = query(requestsRef, where('vendorId', '==', userId));

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const allRequests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        service: {
          ...doc.data().service,
          date: doc.data().service.date?.toDate()
        }
      })) as ServiceApprovalRequest[];

      const pending = allRequests.filter(req => req.status === 'pending');
      const rejected = allRequests.filter(req => req.status === 'rejected');

      setPendingRequests(pending);
      setRejectedRequests(rejected);
      setLoading(false);
    });

    fetchActiveServices();

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (serviceToEdit) {
      setEditForm({
        name: serviceToEdit.name,
        description: serviceToEdit.description,
        price: serviceToEdit.price,
        locations: serviceToEdit.locations,
        date: serviceToEdit.date.toISOString().split('T')[0]
      });
    }
  }, [serviceToEdit]);

  const confirmDelete = async () => {
    if (!serviceToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const userDoc = await getDoc(doc(db, 'utilizatori', userId));
      if (!userDoc.exists()) {
        throw new Error('Utilizatorul nu a fost găsit');
      }

      const userData = userDoc.data();
      if (userData.rol !== 'furnizor') {
        throw new Error('Doar furnizorii pot șterge servicii');
      }

      if (serviceToDelete.userId !== userId) {
        throw new Error('Nu ai permisiunea să ștergi acest serviciu');
      }

      await deleteDoc(doc(db, 'events', serviceToDelete.id));

      setActiveServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      setSuccessMessage('Serviciul a fost șters cu succes');
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    } catch (error) {
      console.error('Error deleting service:', error);
      let errorMessage = 'A apărut o eroare la ștergerea serviciului';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!serviceToEdit || isEditing) return;

    setIsEditing(true);
    try {
      const userDoc = await getDoc(doc(db, 'utilizatori', userId));
      if (!userDoc.exists()) {
        throw new Error('Utilizatorul nu a fost găsit');
      }

      const userData = userDoc.data();
      if (userData.rol !== 'furnizor') {
        throw new Error('Doar furnizorii pot edita servicii');
      }

      if (serviceToEdit.userId !== userId) {
        throw new Error('Nu ai permisiunea să editezi acest serviciu');
      }

      const serviceRef = doc(db, 'events', serviceToEdit.id);
      await updateDoc(serviceRef, {
        name: editForm.name,
        description: editForm.description,
        price: editForm.price,
        locations: editForm.locations,
        date: new Date(editForm.date),
        updatedAt: new Date()
      });

      setActiveServices(prev => prev.map(service => 
        service.id === serviceToEdit.id 
          ? {
              ...service,
              name: editForm.name,
              description: editForm.description,
              price: editForm.price,
              locations: editForm.locations,
              date: new Date(editForm.date)
            }
          : service
      ));

      setSuccessMessage('Serviciul a fost actualizat cu succes');
      setEditModalOpen(false);
      setServiceToEdit(null);
    } catch (error) {
      console.error('Error updating service:', error);
      let errorMessage = 'A apărut o eroare la actualizarea serviciului';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsEditing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activ';
      case 'pending':
        return 'În așteptare';
      case 'rejected':
        return 'Respins';
      default:
        return 'Necunoscut';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-100 h-48 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const currentData = activeTab === 'active' ? activeServices : 
                     activeTab === 'pending' ? pendingRequests : 
                     rejectedRequests;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex items-center px-6 py-3 text-sm font-medium ${
            activeTab === 'active'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Servicii Active ({activeServices.length})
        </button>
        
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center px-6 py-3 text-sm font-medium ${
            activeTab === 'pending'
              ? 'border-b-2 border-yellow-500 text-yellow-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Clock className="w-5 h-5 mr-2" />
          În Așteptare ({pendingRequests.length})
        </button>
        
        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center px-6 py-3 text-sm font-medium ${
            activeTab === 'rejected'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <XCircle className="w-5 h-5 mr-2" />
          Respinse ({rejectedRequests.length})
        </button>
      </div>

      {/* Add Service Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => navigate('/adauga-serviciu')}
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Adaugă serviciu
        </Button>
      </div>

      {/* Content */}
      {currentData.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            {activeTab === 'active' && <PlusCircle className="w-16 h-16 text-gray-400 mx-auto" />}
            {activeTab === 'pending' && <Clock className="w-16 h-16 text-yellow-400 mx-auto" />}
            {activeTab === 'rejected' && <XCircle className="w-16 h-16 text-red-400 mx-auto" />}
          </div>
          <p className="text-gray-600">
            {activeTab === 'active' && 'Nu ai servicii active încă.'}
            {activeTab === 'pending' && 'Nu ai servicii în așteptarea aprobării.'}
            {activeTab === 'rejected' && 'Nu ai servicii respinse.'}
          </p>
          {activeTab === 'active' && (
            <Button
              variant="primary"
              onClick={() => navigate('/adauga-serviciu')}
              className="mt-4"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Adaugă primul serviciu
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTab === 'active' ? (
            // Active Services
            activeServices.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={service.imageUrl}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => {
                        setServiceToEdit(service);
                        setEditModalOpen(true);
                      }}
                      className="p-2 bg-amber-100 rounded-full text-amber-600 hover:bg-amber-200 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setServiceToDelete(service);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('active')}`}>
                      {getStatusIcon('active')}
                      <span className="ml-1">{getStatusText('active')}</span>
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {service.locations.join(', ')}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {service.date.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mt-4 text-lg font-semibold text-amber-600">
                    {service.price.amount.toLocaleString('ro-RO')} RON
                    <span className="text-sm text-gray-500 ml-1">
                      {service.price.type === 'per_hour' && '/ oră'}
                      {service.price.type === 'per_person' && '/ persoană'}
                      {service.price.type === 'per_event' && '/ eveniment'}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            // Pending/Rejected Requests
            (activeTab === 'pending' ? pendingRequests : rejectedRequests).map((request) => (
              <Card key={request.id} className="overflow-hidden">
                <div className="relative h-48">
                  <img
                    src={request.service.imageUrl}
                    alt={request.service.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => {
                        setRequestToView(request);
                        setViewModalOpen(true);
                      }}
                      className="p-2 bg-white/90 rounded-full text-gray-600 hover:bg-white transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-1">{getStatusText(request.status)}</span>
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{request.service.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {request.service.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {request.service.locations.join(', ')}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {request.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-lg font-semibold text-amber-600">
                      {request.service.price.amount.toLocaleString('ro-RO')} RON
                      <span className="text-sm text-gray-500 ml-1">
                        {request.service.price.type === 'per_hour' && '/ oră'}
                        {request.service.price.type === 'per_person' && '/ persoană'}
                        {request.service.price.type === 'per_event' && '/ eveniment'}
                      </span>
                    </div>
                  </div>

                  {request.status === 'rejected' && request.adminFeedback && (
                    <div className="mt-4 p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">
                        <strong>Feedback admin:</strong> {request.adminFeedback}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* View Request Modal */}
      <AnimatePresence>
        {viewModalOpen && requestToView && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setViewModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{requestToView.service.name}</h2>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(requestToView.status)}`}>
                        {getStatusIcon(requestToView.status)}
                        <span className="ml-2">{getStatusText(requestToView.status)}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <img
                      src={requestToView.service.imageUrl}
                      alt={requestToView.service.name}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Descriere</h3>
                    <p className="text-gray-600">{requestToView.service.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Preț</h3>
                      <p className="text-2xl font-bold text-amber-600">
                        {requestToView.service.price.amount.toLocaleString('ro-RO')} RON
                        <span className="text-sm text-gray-500 ml-1">
                          {requestToView.service.price.type === 'per_hour' && '/ oră'}
                          {requestToView.service.price.type === 'per_person' && '/ persoană'}
                          {requestToView.service.price.type === 'per_event' && '/ eveniment'}
                        </span>
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-2">Locații</h3>
                      <p className="text-gray-600">{requestToView.service.locations.join(', ')}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Subcategorii</h3>
                    <div className="flex flex-wrap gap-2">
                      {requestToView.service.subcategories.map((sub, index) => (
                        <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Tag-uri</h3>
                    <div className="flex flex-wrap gap-2">
                      {requestToView.service.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {requestToView.adminFeedback && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Feedback Administrator</h3>
                      <div className={`p-4 rounded-lg ${
                        requestToView.status === 'rejected' ? 'bg-red-50' : 'bg-green-50'
                      }`}>
                        <p className={`${
                          requestToView.status === 'rejected' ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {requestToView.adminFeedback}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-500">
                    <p>Trimis la: {requestToView.createdAt.toLocaleString('ro-RO')}</p>
                    {requestToView.updatedAt && (
                      <p>Actualizat la: {requestToView.updatedAt.toLocaleString('ro-RO')}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
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
                Ești sigur că vrei să ștergi acest serviciu? Această acțiune este permanentă.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setServiceToDelete(null);
                  }}
                  disabled={isDeleting}
                >
                  Anulează
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400"
                  onClick={confirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Se șterge...' : 'Confirmă ștergerea'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editModalOpen && (
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
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Editare serviciu
              </h3>

              <div className="space-y-6">
                <Input
                  label="Nume serviciu"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descriere
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    label="Preț (RON)"
                    value={editForm.price.amount}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      price: { ...prev.price, amount: Number(e.target.value) }
                    }))}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tip preț
                    </label>
                    <select
                      value={editForm.price.type}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        price: { ...prev.price, type: e.target.value as typeof editForm.price.type }
                      }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    >
                      {PRICE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <MultiSelect
                  label="Locații disponibile"
                  options={CITIES}
                  value={editForm.locations}
                  onChange={(locations) => setEditForm(prev => ({ ...prev, locations }))}
                />

                <Input
                  type="date"
                  label="Data disponibilitate"
                  value={editForm.date}
                  onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                />

                <div className="flex justify-end space-x-4 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditModalOpen(false);
                      setServiceToEdit(null);
                    }}
                    disabled={isEditing}
                  >
                    Anulează
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleEdit}
                    disabled={isEditing}
                  >
                    {isEditing ? 'Se salvează...' : 'Salvează modificările'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success/Error Toast */}
      {(successMessage || error) && (
        <Toast
          message={successMessage || error}
          type={successMessage ? 'success' : 'error'}
          onClose={() => {
            setSuccessMessage('');
            setError('');
          }}
        />
      )}
    </div>
  );
};