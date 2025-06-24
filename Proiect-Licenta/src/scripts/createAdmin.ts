import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const createAdmin = async () => {
  try {
    const auth = getAuth();
    
    // Create admin account
    const adminEmail = 'admin@eventoria.ro';
    const adminPassword = 'admin123456'; // Change this to a secure password
    
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    const user = userCredential.user;

    // Create admin profile in Firestore
    await setDoc(doc(db, 'utilizatori', user.uid), {
      id: user.uid,
      nume: 'Administrator',
      email: adminEmail,
      rol: 'admin',
      creat_la: serverTimestamp()
    });

    console.log('Admin account created successfully');
  } catch (error) {
    console.error('Error creating admin account:', error);
  }
};

// Execute the script
createAdmin();