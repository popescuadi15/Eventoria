import React, { useState, useContext } from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Toast } from '../ui/Toast';
import { FavoritesContext } from '../../context/FavoritesContext';

interface FavoriteButtonProps {
  eventId: string;
  eventName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  eventId, 
  eventName = 'Eveniment', 
  className = '',
  size = 'md'
}) => {
  const { currentUser, userData } = useAuth();
  const { refreshFavorites } = useContext(FavoritesContext);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const isFavorite = userData?.evenimente_salvate?.includes(eventId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      window.location.href = '/conectare';
      return;
    }

    try {
      const userRef = doc(db, 'utilizatori', currentUser.uid);
      await updateDoc(userRef, {
        evenimente_salvate: isFavorite 
          ? arrayRemove(eventId)
          : arrayUnion(eventId)
      });

      // Refresh favorites list
      refreshFavorites();

      setToastMessage(
        isFavorite
          ? `${eventName} a fost eliminat de la favorite`
          : `${eventName} a fost adăugat la favorite`
      );
      setShowToast(true);
    } catch (error) {
      console.error('Error updating favorites:', error);
      setToastMessage('A apărut o eroare. Încearcă din nou.');
      setShowToast(true);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <>
      <button
        onClick={handleToggleFavorite}
        className={`inline-flex items-center gap-2 rounded-full transition-colors ${
          isFavorite 
            ? 'text-red-500 hover:text-red-600' 
            : 'text-gray-400 hover:text-red-500'
        } ${sizeClasses[size]} ${className}`}
      >
        <Heart className={`${iconSizes[size]} ${isFavorite ? 'fill-current' : ''}`} />
        <span className="text-sm font-medium">
          {isFavorite ? 'Salvat' : 'Salvează'}
        </span>
      </button>

      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
};