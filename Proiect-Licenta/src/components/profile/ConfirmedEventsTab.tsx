import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, MapPin, Clock, User, ChevronLeft, ChevronRight, X, Star, Phone, Mail, Euro } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ConfirmedEvent } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmedEventsTabProps {
  userId: string;
  userRole: 'participant' | 'furnizor';
}

interface EventDetails {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  furnizor: string;
  numarTelefon: string;
  email: string;
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  locations: string[];
  subcategories: string[];
  rating?: number;
}

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

const DAYS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

export const ConfirmedEventsTab: React.FC<ConfirmedEventsTabProps> = ({ userId, userRole }) => {
  const [events, setEvents] = useState<ConfirmedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<ConfirmedEvent | null>(null);
  const [eventDetails, setEventDetails] = useState<EventDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const eventsRef = collection(db, 'confirmed_events');
    const eventsQuery = query(
      eventsRef,
      where(userRole === 'furnizor' ? 'vendorId' : 'userId', '==', userId),
      orderBy('startDate', 'asc')
    );

    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as ConfirmedEvent[];

      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching confirmed events:', error);
      setError('A apărut o eroare la încărcarea evenimentelor');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, userRole]);

  const fetchEventDetails = async (eventId: string) => {
    try {
      setLoadingDetails(true);
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      
      if (eventDoc.exists()) {
        const data = eventDoc.data();
        setEventDetails({
          id: eventDoc.id,
          name: data.name,
          description: data.description,
          imageUrl: data.imageUrl,
          furnizor: data.furnizor,
          numarTelefon: data.numarTelefon,
          email: data.email,
          price: data.price,
          locations: data.locations,
          subcategories: data.subcategories || [],
          rating: data.rating || (Math.random() * 2 + 3) // Generate random rating if not exists
        });
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEventClick = async (event: ConfirmedEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    await fetchEventDetails(event.eventId);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setEventDetails(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const groupEventsByDate = () => {
    const groups: { [key: string]: ConfirmedEvent[] } = {};
    events.forEach(event => {
      const dateKey = event.startDate.toISOString().split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-100 h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {userRole === 'furnizor' ? 'Evenimente Confirmate' : 'Furnizorii Mei'}
        </h2>
        <div className="flex gap-2">
          <Button
            variant={view === 'calendar' ? 'primary' : 'outline'}
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="w-5 h-5 mr-2" />
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'outline'}
            onClick={() => setView('list')}
          >
            <List className="w-5 h-5 mr-2" />
            Listă
          </Button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  Astăzi
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {DAYS.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {getDaysInMonth(currentDate).map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isToday = date && date.toDateString() === new Date().toDateString();
                const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();

                return (
                  <div
                    key={index}
                    className={`min-h-24 p-2 bg-white ${
                      !isCurrentMonth ? 'text-gray-400 bg-gray-50' : ''
                    } ${isToday ? 'bg-amber-50 border-2 border-amber-200' : ''}`}
                  >
                    {date && (
                      <>
                        <div className={`text-right text-sm mb-1 ${
                          isToday ? 'font-bold text-amber-600' : 'text-gray-600'
                        }`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 2).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => handleEventClick(event)}
                              className="w-full text-left text-xs p-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors truncate"
                              title={event.eventName}
                            >
                              {event.eventName}
                            </button>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayEvents.length - 2} mai multe
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {userRole === 'furnizor'
                  ? 'Nu ai încă evenimente confirmate.'
                  : 'Nu ai încă furnizori confirmați pentru evenimente.'
                }
              </p>
            </div>
          ) : (
            events.map((event) => (
              <Card 
                key={event.id} 
                className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {event.eventName}
                    </h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-amber-500" />
                        {userRole === 'furnizor' ? event.userName : event.vendorName}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-amber-500" />
                        {event.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-500" />
                        {event.startDate.toLocaleDateString('ro-RO', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-amber-600">
                      {event.price.amount.toLocaleString('ro-RO')} RON
                      <span className="text-sm text-gray-500 ml-1">
                        {event.price.type === 'per_hour' && '/ oră'}
                        {event.price.type === 'per_person' && '/ persoană'}
                        {event.price.type === 'per_event' && '/ eveniment'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Confirmat
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalii Eveniment
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {loadingDetails ? (
                  <div className="animate-pulse space-y-6">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                    <div className="space-y-3">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Event Image */}
                    {eventDetails?.imageUrl && (
                      <div className="relative h-64 rounded-lg overflow-hidden">
                        <img
                          src={eventDetails.imageUrl}
                          alt={eventDetails.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            Confirmat
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Event Title and Rating */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {eventDetails?.name || selectedEvent.eventName}
                        </h3>
                        {eventDetails?.subcategories && eventDetails.subcategories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {eventDetails.subcategories.map((sub, index) => (
                              <span key={index} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {eventDetails?.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-amber-500 fill-current" />
                          <span className="text-lg font-semibold text-gray-900">
                            {eventDetails.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Description */}
                    {eventDetails?.description && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Descriere</h4>
                        <p className="text-gray-600 leading-relaxed">
                          {eventDetails.description}
                        </p>
                      </div>
                    )}

                    {/* Event Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Detalii Eveniment</h4>
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <User className="w-5 h-5 mr-3 text-amber-500" />
                              <div>
                                <span className="text-sm text-gray-500">
                                  {userRole === 'furnizor' ? 'Client' : 'Furnizor'}
                                </span>
                                <p className="font-medium">
                                  {userRole === 'furnizor' ? selectedEvent.userName : selectedEvent.vendorName}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <MapPin className="w-5 h-5 mr-3 text-amber-500" />
                              <div>
                                <span className="text-sm text-gray-500">Locație</span>
                                <p className="font-medium">{selectedEvent.location}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center">
                              <Clock className="w-5 h-5 mr-3 text-amber-500" />
                              <div>
                                <span className="text-sm text-gray-500">Data și ora</span>
                                <p className="font-medium">
                                  {selectedEvent.startDate.toLocaleDateString('ro-RO', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {selectedEvent.startDate.toLocaleTimeString('ro-RO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} - {selectedEvent.endDate.toLocaleTimeString('ro-RO', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Euro className="w-5 h-5 mr-3 text-amber-500" />
                              <div>
                                <span className="text-sm text-gray-500">Preț</span>
                                <p className="font-medium text-lg text-amber-600">
                                  {selectedEvent.price.amount.toLocaleString('ro-RO')} RON
                                  <span className="text-sm text-gray-500 ml-1">
                                    {selectedEvent.price.type === 'per_hour' && '/ oră'}
                                    {selectedEvent.price.type === 'per_person' && '/ persoană'}
                                    {selectedEvent.price.type === 'per_event' && '/ eveniment'}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Contact Information */}
                        {userRole === 'participant' && eventDetails && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Informații Contact</h4>
                            <div className="space-y-3">
                              <div className="flex items-center">
                                <Phone className="w-5 h-5 mr-3 text-amber-500" />
                                <div>
                                  <span className="text-sm text-gray-500">Telefon</span>
                                  <p className="font-medium">
                                    <a 
                                      href={`tel:${eventDetails.numarTelefon}`}
                                      className="text-amber-600 hover:text-amber-700"
                                    >
                                      {eventDetails.numarTelefon}
                                    </a>
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center">
                                <Mail className="w-5 h-5 mr-3 text-amber-500" />
                                <div>
                                  <span className="text-sm text-gray-500">Email</span>
                                  <p className="font-medium">
                                    <a 
                                      href={`mailto:${eventDetails.email}`}
                                      className="text-amber-600 hover:text-amber-700"
                                    >
                                      {eventDetails.email}
                                    </a>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Additional Notes */}
                        {selectedEvent.notes && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Note suplimentare</h4>
                            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                              {selectedEvent.notes}
                            </p>
                          </div>
                        )}

                        {/* Service Type */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Tip serviciu</h4>
                          <p className="text-gray-600 bg-amber-50 p-3 rounded-lg">
                            {selectedEvent.serviceType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Locations */}
                    {eventDetails?.locations && eventDetails.locations.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Locații disponibile</h4>
                        <div className="flex flex-wrap gap-2">
                          {eventDetails.locations.map((location, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                              {location}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Event Dates */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Cronologie</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eveniment confirmat:</span>
                          <span className="font-medium">
                            {selectedEvent.createdAt.toLocaleDateString('ro-RO')}
                          </span>
                        </div>
                        {selectedEvent.updatedAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ultima actualizare:</span>
                            <span className="font-medium">
                              {selectedEvent.updatedAt.toLocaleDateString('ro-RO')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};