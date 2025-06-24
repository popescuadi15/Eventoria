import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calendar, Phone, Mail, ArrowLeft, Star, Clock, Tag, MessageSquare } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { FavoriteButton } from '../components/events/FavoriteButton';
import { ContactForm } from '../components/events/ContactForm';
import { useAuth } from '../context/AuthContext';

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategories: string[];
  tags: string[];
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  locations: string[];
  date: Date;
  imageUrl: string;
  createdAt: Date;
  furnizor: string;
  userId: string;
  numarTelefon: string;
  email: string;
}

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (!eventId) return;
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (!eventDoc.exists()) {
          setError('Evenimentul nu a fost găsit');
          return;
        }
        
        const data = eventDoc.data();
        setEvent({
          id: eventDoc.id,
          ...data,
          date: data.date?.toDate(),
          createdAt: data.createdAt?.toDate(),
        } as Event);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('A apărut o eroare la încărcarea evenimentului');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  // Function to mask phone number
  const maskPhoneNumber = (phone: string) => {
    if (!phone) return '';
    // Keep first 2 digits and last digit, mask the rest
    if (phone.length <= 3) return phone;
    const start = phone.substring(0, 2);
    const end = phone.substring(phone.length - 1);
    const masked = '*'.repeat(phone.length - 3);
    return start + masked + end;
  };

  // Function to mask email
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    // Keep first character of local part, mask the rest
    const maskedLocal = localPart.charAt(0) + '*'.repeat(Math.max(0, localPart.length - 1));
    return maskedLocal + '@' + domain;
  };

  // Check if current user is the vendor
  const isVendor = currentUser?.uid === event?.userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Evenimentul nu a fost găsit'}
          </h2>
          <Button variant="primary" onClick={() => navigate(-1)}>
            Înapoi la evenimente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-[50vh] bg-black">
        <div className="absolute inset-0">
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
        </div>
        
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="bg-white/90 hover:bg-white"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Înapoi
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="p-6 sm:p-10">
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    {event.subcategories.map((subcategory, index) => (
                      <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
                        {subcategory}
                      </span>
                    ))}
                    <div className="flex items-center text-amber-500">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="ml-1 text-sm font-medium">4.8</span>
                    </div>
                  </div>
                  <FavoriteButton 
                    eventId={event.id} 
                    eventName={event.name}
                    size="lg"
                  />
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                  {event.name}
                </h1>
                
                <div className="flex flex-wrap gap-6 text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-amber-500" />
                    {event.locations.join(', ')}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-amber-500" />
                    {new Date(event.date).toLocaleDateString('ro-RO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-amber-500" />
                    Program: 10:00 - 22:00
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Descriere</h2>
                    <p className="text-gray-600 whitespace-pre-line">
                      {event.description}
                    </p>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Taguri</h2>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          <Tag className="w-4 h-4 inline mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
                    <h2 className="text-2xl font-semibold mb-6">Informații contact</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Furnizor</h3>
                        <p className="text-gray-600">{event.furnizor}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Preț</h3>
                        <p className="text-2xl font-bold text-amber-600">
                          {event.price.amount.toLocaleString('ro-RO')} RON
                          <span className="text-sm text-gray-500 ml-1">
                            {event.price.type === 'per_hour' && '/ oră'}
                            {event.price.type === 'per_person' && '/ persoană'}
                            {event.price.type === 'per_event' && '/ eveniment'}
                          </span>
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        {isVendor ? (
                          <div className="text-amber-600 text-center p-3 bg-amber-50 rounded-lg">
                            Acesta este serviciul tău
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            fullWidth
                            onClick={() => {
                              if (!currentUser) {
                                navigate('/conectare');
                                return;
                              }
                              setIsContactModalOpen(true);
                            }}
                          >
                            <MessageSquare className="w-5 h-5 mr-2" />
                            Contactează furnizorul
                          </Button>
                        )}

                        {!isVendor && (
                          <>
                            {currentUser ? (
                              // Show real contact info for authenticated users
                              <>
                                <a
                                  href={`tel:${event.numarTelefon}`}
                                  className="flex items-center justify-center w-full px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                                >
                                  <Phone className="w-5 h-5 mr-2" />
                                  {event.numarTelefon}
                                </a>
                                
                                <a
                                  href={`mailto:${event.email}`}
                                  className="flex items-center justify-center w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                  <Mail className="w-5 h-5 mr-2" />
                                  {event.email}
                                </a>
                              </>
                            ) : (
                              // Show masked contact info for non-authenticated users
                              <>
                                <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-md cursor-not-allowed">
                                  <Phone className="w-5 h-5 mr-2" />
                                  {maskPhoneNumber(event.numarTelefon)}
                                </div>
                                
                                <div className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 border border-gray-300 text-gray-600 rounded-md cursor-not-allowed">
                                  <Mail className="w-5 h-5 mr-2" />
                                  {maskEmail(event.email)}
                                </div>
                                
                                <div className="text-center text-sm text-gray-500 mt-2">
                                  <button
                                    onClick={() => navigate('/conectare')}
                                    className="text-amber-600 hover:text-amber-700 underline"
                                  >
                                    Conectează-te
                                  </button>
                                  {' '}pentru a vedea informațiile de contact complete
                                </div>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && !isVendor && (
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
              className="bg-white rounded-lg shadow-xl max-w-3xl w-full overflow-auto max-h-[90vh]"
            >
              <ContactForm
                eventId={event.id}
                eventName={event.name}
                vendorId={event.userId}
                onClose={() => setIsContactModalOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventPage;