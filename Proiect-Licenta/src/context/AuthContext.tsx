import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  setUserData: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  unreadNotifications: number;
  pendingRequestsCount: number;
  inregistrare: (email: string, parola: string, nume: string, rol: User['rol']) => Promise<void>;
  conectare: (email: string, parola: string) => Promise<void>;
  deconectare: () => Promise<void>;
  resetareParola: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth trebuie utilizat în interiorul unui AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Main auth state listener - runs only once
  useEffect(() => {
    let unsubscribeRequests: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userRef = doc(db, 'utilizatori', user.uid);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data() as User;
            setUserData(userData);
            
            // Count unread notifications
            const unreadCount = userData.notifications?.filter(n => !n.read).length || 0;
            setUnreadNotifications(unreadCount);

            // Set up admin-specific listener only after user role is confirmed by Firestore
            if (userData.rol === 'admin') {
              // Clean up any existing admin listener
              if (unsubscribeRequests) {
                unsubscribeRequests();
                unsubscribeRequests = null;
              }

              // Set up new admin listener
              const requestsRef = collection(db, 'service_approval_requests');
              const simpleQuery = query(requestsRef, where('status', '==', 'pending'));
              
              unsubscribeRequests = onSnapshot(
                simpleQuery,
                (snapshot) => {
                  setPendingRequestsCount(snapshot.docs.length);
                  console.log('AuthContext: Pending requests count updated:', snapshot.docs.length);
                },
                (error) => {
                  console.error('AuthContext: Error in requests listener:', error);
                  setPendingRequestsCount(0);
                }
              );
            } else {
              // User is not admin, clean up any existing admin listener
              if (unsubscribeRequests) {
                unsubscribeRequests();
                unsubscribeRequests = null;
              }
              setPendingRequestsCount(0);
            }
          }
          setLoading(false);
        });

        return () => {
          unsubscribeUser();
          if (unsubscribeRequests) {
            unsubscribeRequests();
          }
        };
      } else {
        setUserData(null);
        setUnreadNotifications(0);
        setPendingRequestsCount(0);
        setLoading(false);
        
        // Clean up admin listener when user logs out
        if (unsubscribeRequests) {
          unsubscribeRequests();
          unsubscribeRequests = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRequests) {
        unsubscribeRequests();
      }
    };
  }, []); // Empty dependency array to run only once

  const inregistrare = async (email: string, parola: string, nume: string, rol: User['rol']) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, parola);
    const user = userCredential.user;
    
    await setDoc(doc(db, 'utilizatori', user.uid), {
      id: user.uid,
      nume,
      email,
      rol,
      evenimente_salvate: [],
      notifications: [],
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
    setUserData,
    loading,
    unreadNotifications,
    pendingRequestsCount,
    inregistrare,
    conectare,
    deconectare,
    resetareParola
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};