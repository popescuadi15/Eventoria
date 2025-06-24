import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User, FirebaseContextType } from '../types/firebase';

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase trebuie folosit în interiorul FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data() as User);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const inregistrare = async (email: string, parola: string, nume: string, rol: User['rol']) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, parola);
    
    await setDoc(doc(db, 'users', user.uid), {
      id: user.uid,
      nume,
      email,
      rol,
      evenimente_salvate: [],
      creat_la: serverTimestamp()
    });
  };

  const conectare = (email: string, parola: string) => {
    return signInWithEmailAndPassword(auth, email, parola);
  };

  const deconectare = () => {
    return signOut(auth);
  };

  const resetareParola = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  const value = {
    currentUser,
    userData,
    loading,
    inregistrare,
    conectare,
    deconectare,
    resetareParola
  };

  return (
    <FirebaseContext.Provider value={value}>
      {!loading && children}
    </FirebaseContext.Provider>
  );
};