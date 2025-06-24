import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { Heart, Settings, Key, Trash2, LogOut, Mail, User as UserIcon, AlertTriangle, Calendar, MapPin, MessageSquare, Package, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FavoriteButton } from '../components/events/FavoriteButton';
import { RequestsTab } from '../components/profile/RequestsTab';
import { ServicesTab } from '../components/profile/ServicesTab';
import { ConfirmedEventsTab } from '../components/profile/ConfirmedEventsTab';
import { NotificationsTab } from '../components/profile/NotificationsTab';

interface Event {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  date: Date;
  locations: string[];
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, userData, setUserData, deconectare } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'favorites' | 'requests' | 'services' | 'confirmed' | 'settings' | 'notifications'>('profile');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshUserData = async () => {
    if (!currentUser) return;
    
    const userDoc = await getDoc(doc(db, 'utilizatori', currentUser.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data() as User);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/conectare');
      return;
    }

    const state = location.state as { activeTab?: 'profile' | 'favorites' | 'requests' | 'services' | 'confirmed' | 'settings' | 'notifications' };
    if (state?.activeTab) {
      setActiveTab(state.activeTab);
      window.history.replaceState({}, document.title);
    }
  }, [currentUser, navigate, location]);

  const handlePasswordReset = async () => {
    try {
      setLoading(true);
      setError(null);
      await sendPasswordResetEmail(currentUser!.auth, currentUser!.email!);
      setSuccessMessage('Email-ul pentru resetarea parolei a fost trimis cu succes!');
    } catch (error) {
      setError('A apărut o eroare la trimiterea email-ului de resetare.');
      console.error('Error sending password reset email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteDoc(doc(db, 'utilizatori', currentUser!.uid));
      await deleteUser(currentUser!);
      await deconectare();
      navigate('/');
    } catch (error) {
      setError('A apărut o eroare la ștergerea contului.');
      console.error('Error deleting account:', error);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleFavorite = async (eventId: string) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, 'utilizatori', currentUser.uid);
      const isFavorite = userData?.evenimente_salvate?.includes(eventId);

      await updateDoc(userRef, {
        evenimente_salvate: isFavorite 
          ? arrayRemove(eventId)
          : arrayUnion(eventId)
      });

      setSuccessMessage(isFavorite 
        ? 'Eveniment eliminat de la favorite!'
        : 'Eveniment adăugat la favorite!'
      );
    } catch (error) {
      setError('A apărut o eroare la actualizarea favoritelor.');
      console.error('Error updating favorites:', error);
    }
  };

  if (!currentUser || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="h-32 bg-gradient-to-r from-amber-500 to-amber-600"></div>
          <div className="px-6 py-4 sm:px-8 sm:py-6 -mt-16">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                <div className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-4xl font-bold text-amber-600">
                    {userData?.nume?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900">{userData?.nume || 'Utilizator'}</h1>
                <p className="text-gray-600">{userData?.email}</p>
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    {(userData?.rol?.charAt(0)?.toUpperCase() + userData?.rol?.slice(1)) || 'Utilizator'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <UserIcon className="w-5 h-5 mr-2" />
            Profil
          </button>
          
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'favorites'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Heart className="w-5 h-5 mr-2" />
            Evenimente Favorite
          </button>
          
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'requests'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            {userData.rol === 'furnizor' ? 'Cereri Primite' : 'Cereri Trimise'}
          </button>

          <button
            onClick={() => setActiveTab('confirmed')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'confirmed'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-5 h-5 mr-2" />
            {userData.rol === 'furnizor' ? 'Evenimente Confirmate' : 'Furnizorii Mei'}
          </button>

          {userData.rol === 'furnizor' && (
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
                activeTab === 'services'
                  ? 'border-b-2 border-amber-500 text-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Package className="w-5 h-5 mr-2" />
              Serviciile Mele
            </button>
          )}

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bell className="w-5 h-5 mr-2" />
            Notificări
            {userData?.notifications?.some(n => !n.read) && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">
                {userData.notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-b-2 border-amber-500 text-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Setări
          </button>
        </div>

        {/* Success/Error Messages */}
        <AnimatePresence>
          {(successMessage || error) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-8 p-4 rounded-lg ${
                successMessage ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              {successMessage || error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Sections */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Informații Personale</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nume Complet</label>
                  <div className="mt-1 flex items-center space-x-3">
                    <span className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                      {userData?.nume || 'Nespecificat'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 flex items-center space-x-3">
                    <span className="block w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900">
                      {userData?.email || 'Nespecificat'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Evenimente Favorite</h2>
              {userData?.evenimente_salvate?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userData.evenimente_salvate.map((eventId) => (
                    <FavoriteEventCard key={eventId} eventId={eventId} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nu ai salvat încă niciun eveniment la favorite.</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/evenimente')}
                    className="mt-4"
                  >
                    Explorează evenimente
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {userData.rol === 'furnizor' ? 'Cereri Primite' : 'Cereri Trimise'}
              </h2>
              <RequestsTab userId={currentUser.uid} userRole={userData.rol} />
            </div>
          )}

          {activeTab === 'confirmed' && (
            <ConfirmedEventsTab userId={currentUser.uid} userRole={userData.rol} />
          )}

          {activeTab === 'services' && userData.rol === 'furnizor' && (
            <ServicesTab userId={currentUser.uid} />
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Notificări</h2>
              <NotificationsTab 
                userId={currentUser.uid}
                notifications={userData?.notifications || []}
                onNotificationsUpdate={refreshUserData}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Setări Cont</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Mail className="w-6 h-6 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Schimbă Email</h3>
                        <p className="text-sm text-gray-500">Actualizează adresa de email asociată contului</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Actualizează
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Key className="w-6 h-6 text-gray-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Resetare Parolă</h3>
                        <p className="text-sm text-gray-500">Primește un email pentru resetarea parolei</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePasswordReset}
                      disabled={loading}
                    >
                      Resetează
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <Trash2 className="w-6 h-6 text-red-400 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-red-900">Ștergere Cont</h3>
                        <p className="text-sm text-red-500">Această acțiune este permanentă și nu poate fi anulată</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setIsDeleteModalOpen(true)}
                    >
                      Șterge
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Sesiune</h2>
                <Button
                  variant="outline"
                  onClick={deconectare}
                  className="w-full sm:w-auto"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Deconectare
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
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
                Confirmare ștergere cont
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Ești sigur că vrei să ștergi contul? Această acțiune este permanentă și toate datele tale vor fi șterse definitiv.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                >
                  Anulează
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? 'Se șterge...' : 'Confirmă ștergerea'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FavoriteEventCard: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [event, setEvent] = useState<Event | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          setEvent({
            id: eventDoc.id,
            ...eventDoc.data(),
            date: eventDoc.data().date?.toDate()
          } as Event);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (!event) return null;

  return (
    <Card animate className="group relative overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton eventId={event.id} />
      </div>
      
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {event.name}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            {new Date(event.date).toLocaleDateString('ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2" />
            {event.locations.join(', ')}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-amber-600">
            {event.price.amount.toLocaleString('ro-RO')} RON
            <span className="text-sm text-gray-500 ml-1">
              {event.price.type === 'per_hour' && '/ oră'}
              {event.price.type === 'per_person' && '/ persoană'}
              {event.price.type === 'per_event' && '/ eveniment'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/eveniment/${event.id}`)}
          >
            Vezi detalii
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfilePage;