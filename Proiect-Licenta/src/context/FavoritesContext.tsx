import React, { createContext, useState, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  refreshFavorites: () => Promise<void>;
}

export const FavoritesContext = createContext<FavoritesContextType>({
  refreshFavorites: async () => {}
});

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userData: _, setUserData } = useAuth();

  const refreshFavorites = useCallback(async () => {
    if (!currentUser) return;

    try {
      const userDoc = await getDoc(doc(db, 'utilizatori', currentUser.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error refreshing favorites:', error);
    }
  }, [currentUser, setUserData]);

  return (
    <FavoritesContext.Provider value={{ refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
};