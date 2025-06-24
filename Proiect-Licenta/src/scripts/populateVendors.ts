import { db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const vendors = [
  {
    id: 'vendor_1',
    categoryId: 'category_1', // Locație Eveniment
    name: 'Palatul Bragadiru',
    description: 'Sală de evenimente istorică cu arhitectură impresionantă și facilități moderne',
    imageUrl: 'https://images.pexels.com/photos/260928/pexels-photo-260928.jpeg',
    subcategories: ['Săli de nuntă', 'Spații corporative'],
    rating: 4.8,
    reviewCount: 156,
    priceRange: {
      min: 5000,
      max: 15000
    },
    location: 'București, Sector 5',
    contactInfo: {
      email: 'contact@palatulbragadiru.ro',
      phone: '+40 721 234 567'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    id: 'vendor_2',
    categoryId: 'category_1',
    name: 'Garden Events',
    description: 'Grădină pentru evenimente în aer liber cu peisagistică spectaculoasă',
    imageUrl: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg',
    subcategories: ['Grădini și terase', 'Spații exterioare'],
    rating: 4.7,
    reviewCount: 98,
    priceRange: {
      min: 3000,
      max: 8000
    },
    location: 'București, Sector 1',
    contactInfo: {
      email: 'rezervari@gardenevents.ro',
      phone: '+40 722 345 678'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  {
    id: 'vendor_3',
    categoryId: 'category_1',
    name: 'Business Center Premium',
    description: 'Centru de conferințe modern cu echipamente de ultimă generație',
    imageUrl: 'https://images.pexels.com/photos/275484/pexels-photo-275484.jpeg',
    subcategories: ['Săli de conferințe', 'Spații corporative'],
    rating: 4.9,
    reviewCount: 124,
    priceRange: {
      min: 2000,
      max: 5000
    },
    location: 'București, Sector 2',
    contactInfo: {
      email: 'office@businesscenter.ro',
      phone: '+40 723 456 789'
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const populateVendors = async () => {
  try {
    for (const vendor of vendors) {
      const vendorRef = doc(db, 'vendors', vendor.id);
      await setDoc(vendorRef, vendor);
      console.log(`Vendor ${vendor.name} added successfully`);
    }
    console.log('All vendors have been added successfully');
  } catch (error) {
    console.error('Error adding vendors:', error);
  }
};

// Execute the population
populateVendors();