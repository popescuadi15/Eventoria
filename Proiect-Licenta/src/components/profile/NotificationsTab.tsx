import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, X, AlertCircle, UserPlus, MessageSquare, Calendar } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Notification {
  type: 'service_approved' | 'service_rejected' | 'request_accepted' | 'request_rejected' | 'event_confirmed' | 'new_message';
  message: string;
  createdAt: string;
  read: boolean;
  requestId?: string;
  eventName?: string;
  confirmedEventId?: string;
}

interface NotificationsTabProps {
  userId: string;
  notifications: Notification[];
  onNotificationsUpdate: () => void;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({ 
  userId, 
  notifications,
  onNotificationsUpdate
}) => {
  const markAsRead = async (index: number) => {
    try {
      const userRef = doc(db, 'utilizatori', userId);
      const updatedNotifications = [...notifications];
      updatedNotifications[index] = {
        ...updatedNotifications[index],
        read: true
      };

      await updateDoc(userRef, {
        notifications: updatedNotifications
      });

      onNotificationsUpdate();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const userRef = doc(db, 'utilizatori', userId);
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));

      await updateDoc(userRef, {
        notifications: updatedNotifications
      });

      onNotificationsUpdate();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'service_approved':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'service_rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'request_accepted':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'request_rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'event_confirmed':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    const baseColor = read ? 'bg-gray-50' : 'bg-white';
    let borderColor = 'border-gray-200';
    
    if (!read) {
      switch (type) {
        case 'service_approved':
        case 'request_accepted':
        case 'event_confirmed':
          borderColor = 'border-green-200';
          break;
        case 'service_rejected':
        case 'request_rejected':
          borderColor = 'border-red-200';
          break;
        case 'new_message':
          borderColor = 'border-purple-200';
          break;
        default:
          borderColor = 'border-amber-200';
      }
    }
    
    return `${baseColor} ${borderColor}`;
  };

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Nu ai notificări noi</p>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Notificări ({unreadCount} necitite)
        </h2>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="text-amber-600 hover:text-amber-700 border-amber-300 hover:border-amber-400"
          >
            Marchează toate ca citite
          </Button>
        )}
      </div>

      {notifications.map((notification, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            className={`p-4 border-l-4 cursor-pointer transition-all hover:shadow-md ${getNotificationColor(notification.type, notification.read)}`}
            onClick={() => !notification.read && markAsRead(index)}
          >
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-full flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`${notification.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {notification.message}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleDateString('ro-RO', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {notification.eventName && (
                  <p className="text-sm text-amber-600 mt-1 font-medium">
                    Eveniment: {notification.eventName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!notification.read && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    Nou
                  </span>
                )}
                {notification.read && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};