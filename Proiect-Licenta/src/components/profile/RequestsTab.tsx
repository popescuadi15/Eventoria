import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ServiceRequest } from '../../types';
import { Card } from '../ui/Card';
import { Calendar, MapPin, Phone, Mail, Clock, Send, User, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface RequestsTabProps {
  userId: string;
  userRole: 'participant' | 'furnizor';
}

export const RequestsTab: React.FC<RequestsTabProps> = ({ userId, userRole }) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState<string | null>(null);
  const [vendorNames, setVendorNames] = useState<Record<string, string>>({});
  const [confirmedEvents, setConfirmedEvents] = useState<Set<string>>(new Set());
  const [confirmingEvent, setConfirmingEvent] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time listener for requests
    const requestsRef = collection(db, 'requests');
    const requestsQuery = query(
      requestsRef,
      where(userRole === 'furnizor' ? 'vendorId' : 'userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeRequests = onSnapshot(requestsQuery, async (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        messages: doc.data().messages?.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp?.toDate()
        })) || []
      })) as ServiceRequest[];

      const validRequests = await Promise.all(
        requestsData.map(async (request) => {
          const eventDoc = await getDoc(doc(db, 'events', request.eventId));
          return eventDoc.exists() ? request : null;
        })
      );

      setRequests(validRequests.filter((req): req is ServiceRequest => req !== null));

      // Fetch vendor names
      const vendorIds = [...new Set(requestsData.map(req => req.vendorId))];
      const vendorData: Record<string, string> = {};
      
      for (const vendorId of vendorIds) {
        const vendorDoc = await getDoc(doc(db, 'utilizatori', vendorId));
        if (vendorDoc.exists()) {
          vendorData[vendorId] = vendorDoc.data().nume;
        }
      }
      
      setVendorNames(vendorData);
      setLoading(false);
    });

    // Set up real-time listener for confirmed events
    const confirmedEventsQuery = query(
      collection(db, 'confirmed_events'),
      where(userRole === 'furnizor' ? 'vendorId' : 'userId', '==', userId)
    );

    const unsubscribeConfirmed = onSnapshot(confirmedEventsQuery, (snapshot) => {
      const confirmedRequestIds = new Set(
        snapshot.docs.map(doc => doc.data().requestId)
      );
      setConfirmedEvents(confirmedRequestIds);
    });

    return () => {
      unsubscribeRequests();
      unsubscribeConfirmed();
    };
  }, [userId, userRole]);

  const addNotificationToUser = async (targetUserId: string, notification: any) => {
    try {
      const userRef = doc(db, 'utilizatori', targetUserId);
      await updateDoc(userRef, {
        notifications: arrayUnion(notification)
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      const requestRef = doc(db, 'requests', requestId);
      
      const request = requests.find(r => r.id === requestId);
      if (!request) {
        setError('Cererea nu a fost găsită');
        return;
      }

      if (userRole === 'furnizor' && request.vendorId !== userId) {
        setError('Nu ai permisiunea să modifici această cerere');
        return;
      }

      await updateDoc(requestRef, {
        status: newStatus
      });

      // Add notification to participant
      if (userRole === 'furnizor') {
        const notification = {
          type: newStatus === 'accepted' ? 'request_accepted' : 'request_rejected',
          message: `Cererea ta pentru "${request.eventName}" a fost ${newStatus === 'accepted' ? 'acceptată' : 'respinsă'} de furnizor`,
          createdAt: new Date().toISOString(),
          read: false,
          requestId: requestId,
          eventName: request.eventName
        };

        await addNotificationToUser(request.userId, notification);
      }

      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: newStatus }
          : req
      ));

      setSuccessMessage('Statusul a fost actualizat cu succes');
    } catch (error) {
      console.error('Error updating status:', error);
      setError('A apărut o eroare la actualizarea statusului');
    }
  };

  const handleConfirmEvent = async (request: ServiceRequest) => {
    if (confirmingEvent === request.id) return; // Previne click-uri multiple

    try {
      setConfirmingEvent(request.id);
      setError(null);

      // Get the original event to fetch price information
      const eventDoc = await getDoc(doc(db, 'events', request.eventId));
      if (!eventDoc.exists()) {
        throw new Error('Evenimentul nu mai există');
      }

      const eventData = eventDoc.data();

      // Create confirmed event with price from original event
      const confirmedEventData = {
        eventId: request.eventId,
        requestId: request.id,
        eventName: request.eventName,
        userId: request.userId,
        userName: request.userName,
        vendorId: request.vendorId,
        vendorName: vendorNames[request.vendorId] || 'Furnizor necunoscut',
        serviceType: eventData.subcategories?.[0] || 'Serviciu general',
        location: request.location,
        startDate: request.startDate,
        endDate: request.endDate,
        price: eventData.price || {
          amount: 0,
          type: 'per_event'
        },
        notes: request.message,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      console.log('Creating confirmed event with data:', confirmedEventData);

      // Add to confirmed_events collection
      const confirmedEventRef = await addDoc(collection(db, 'confirmed_events'), confirmedEventData);
      console.log('Confirmed event created with ID:', confirmedEventRef.id);

      // Update request status and add confirmedEventId
      await updateDoc(doc(db, 'requests', request.id), {
        status: 'accepted',
        confirmedEventId: confirmedEventRef.id
      });

      console.log('Request updated with confirmed event ID');

      // Add notification to participant
      const notification = {
        type: 'event_confirmed',
        message: `Evenimentul "${request.eventName}" a fost confirmat! Detaliile finale sunt disponibile în secțiunea "Furnizorii Mei"`,
        createdAt: new Date().toISOString(),
        read: false,
        requestId: request.id,
        eventName: request.eventName,
        confirmedEventId: confirmedEventRef.id
      };

      await addNotificationToUser(request.userId, notification);
      console.log('Notification sent to participant');

      // Update local state
      setConfirmedEvents(prev => new Set([...prev, request.id]));
      setSuccessMessage('Evenimentul a fost confirmat cu succes! Acum este vizibil în secțiunea "Evenimente Confirmate".');

    } catch (error) {
      console.error('Error confirming event:', error);
      setError(`A apărut o eroare la confirmarea evenimentului: ${error.message}`);
    } finally {
      setConfirmingEvent(null);
    }
  };

  const handleSendMessage = async (requestId: string) => {
    if (!newMessage.trim()) {
      setError('Te rugăm să introduceți un mesaj');
      return;
    }

    // Prevent multiple sends for the same request
    if (sendingMessage === requestId) {
      return;
    }

    try {
      setSendingMessage(requestId);
      const requestRef = doc(db, 'requests', requestId);
      const request = requests.find(r => r.id === requestId);
      
      if (!request) {
        setError('Cererea nu a fost găsită');
        return;
      }

      if (userRole === 'furnizor' && request.vendorId !== userId) {
        setError('Nu ai permisiunea să modifici această cerere');
        return;
      }

      if (userRole === 'participant' && request.userId !== userId) {
        setError('Nu ai permisiunea să modifici această cerere');
        return;
      }
      
      const messageData = {
        senderId: userId,
        senderName: userRole === 'furnizor' ? vendorNames[userId] : request.userName,
        message: newMessage,
        timestamp: Timestamp.now()
      };

      await updateDoc(requestRef, {
        messages: arrayUnion(messageData)
      });

      // Add notification to the other party
      const targetUserId = userRole === 'furnizor' ? request.userId : request.vendorId;
      const senderName = userRole === 'furnizor' ? vendorNames[userId] : request.userName;
      
      const notification = {
        type: 'new_message',
        message: `Mesaj nou de la ${senderName} pentru "${request.eventName}"`,
        createdAt: new Date().toISOString(),
        read: false,
        requestId: requestId,
        eventName: request.eventName
      };

      await addNotificationToUser(targetUserId, notification);

      // Clear the message input immediately after successful send
      setNewMessage('');
      setSuccessMessage('Mesajul a fost trimis cu succes');

    } catch (error) {
      console.error('Error sending message:', error);
      setError('A apărut o eroare la trimiterea mesajului');
    } finally {
      setSendingMessage(null);
    }
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

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          {userRole === 'furnizor' 
            ? 'Nu ai primit încă nicio cerere de la clienți.'
            : 'Nu ai trimis încă nicio cerere către furnizori.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <div className="bg-gray-50 p-4 border-b">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{request.eventName}</h3>
                <p className="text-gray-600 text-sm">
                  Creat la: {request.createdAt.toLocaleDateString()}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    request.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : request.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status === 'pending' ? 'În așteptare' : 
                     request.status === 'accepted' ? 'Acceptat' : 'Refuzat'}
                  </span>
                  
                  {confirmedEvents.has(request.id) && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Check className="w-3 h-3 mr-1" />
                      Confirmat
                    </span>
                  )}
                </div>
              </div>
              
              {userRole === 'furnizor' && (
                <div className="flex items-center gap-4">
                  <select
                    value={request.status}
                    onChange={(e) => handleStatusChange(request.id, e.target.value as 'pending' | 'accepted' | 'rejected')}
                    className={`px-4 py-2 rounded-lg border ${
                      request.status === 'pending'
                        ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                        : request.status === 'accepted'
                        ? 'bg-green-50 text-green-800 border-green-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                    disabled={confirmingEvent === request.id}
                  >
                    <option value="pending">În așteptare</option>
                    <option value="accepted">Acceptat</option>
                    <option value="rejected">Refuzat</option>
                  </select>

                  {request.status === 'accepted' && !confirmedEvents.has(request.id) && (
                    <Button
                      variant="primary"
                      onClick={() => handleConfirmEvent(request)}
                      disabled={confirmingEvent === request.id}
                      isLoading={confirmingEvent === request.id}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      {confirmingEvent === request.id ? 'Se confirmă...' : 'Confirmă Eveniment'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-2 text-amber-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Perioada</div>
                  <div>{request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600">
                <Clock className="w-5 h-5 mr-2 text-amber-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Program</div>
                  <div>{request.startDate.toLocaleTimeString()} - {request.endDate.toLocaleTimeString()}</div>
                </div>
              </div>
              
              <div className="flex items-center text-gray-600">
                <MapPin className="w-5 h-5 mr-2 text-amber-500" />
                <div>
                  <div className="text-sm font-medium text-gray-700">Locație</div>
                  <div>{request.location}</div>
                </div>
              </div>

              {userRole === 'furnizor' && (
                <>
                  <div className="flex items-center text-gray-600">
                    <User className="w-5 h-5 mr-2 text-amber-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Client</div>
                      <div>{request.userName}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-5 h-5 mr-2 text-amber-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Telefon</div>
                      <div>{request.userPhone}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-5 h-5 mr-2 text-amber-500" />
                    <div>
                      <div className="text-sm font-medium text-gray-700">Email</div>
                      <div>{request.userEmail}</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Mesaj inițial</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">{request.message}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-2">Conversație</h4>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {request.messages?.map((msg, index) => (
                  <motion.div
                    key={`${msg.senderId}-${msg.timestamp?.getTime()}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg ${
                      msg.senderId === userId
                        ? 'bg-amber-50 ml-8'
                        : 'bg-gray-50 mr-8'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-gray-900">
                        {msg.senderId === request.vendorId ? vendorNames[msg.senderId] : request.userName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {msg.timestamp.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-600">{msg.message}</p>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Scrie un mesaj..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) {
                      e.preventDefault();
                      handleSendMessage(request.id);
                    }
                  }}
                  disabled={sendingMessage === request.id}
                />
                <Button
                  variant="primary"
                  onClick={() => handleSendMessage(request.id)}
                  disabled={sendingMessage === request.id || !newMessage.trim()}
                >
                  {sendingMessage === request.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {successMessage && (
        <Toast
          message={successMessage}
          type="success"
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
};