import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const ADMIN_ID = 'qAGhI5D5fVQMeugBMJR3oocUqZ52'; // Înlocuiește cu UID-ul adminului tău

const updateAdminDocument = async () => {
  try {
    const adminRef = doc(db, 'utilizatori', ADMIN_ID);
    
    await updateDoc(adminRef, {
      servicii_administrate: {
        aprobate: [],
        respinse: [],
        in_asteptare: []
      }
    });

    console.log('Admin document updated successfully');
  } catch (error) {
    console.error('Error updating admin document:', error);
  }
};

// Execute the script
updateAdminDocument();