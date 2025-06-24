import { User as FirebaseUser } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  nume: string;
  email: string;
  rol: 'participant' | 'furnizor' | 'admin';
  evenimente_salvate?: string[];
  creat_la: Timestamp;
}

export interface FirebaseContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  inregistrare: (email: string, parola: string, nume: string, rol: User['rol']) => Promise<void>;
  conectare: (email: string, parola: string) => Promise<void>;
  deconectare: () => Promise<void>;
  resetareParola: (email: string) => Promise<void>;
}