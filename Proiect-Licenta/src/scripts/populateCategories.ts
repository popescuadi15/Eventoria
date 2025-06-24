import { db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const categories = [
  {
    id: 'category_1',
    name: 'Locație Eveniment',
    description: 'Spații premium pentru evenimente de orice dimensiune',
    imageUrl: 'https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg',
    priceRange: {
      min: 1000,
      max: 5000
    },
    rating: 4.8,
    subcategories: [
      'Săli de nuntă',
      'Spații corporative',
      'Grădini și terase',
      'Săli de conferințe',
      'Spații tematice',
      'Spații exterioare'
    ],
    tags: ['wedding', 'corporate', 'outdoor'],
    vendorCount: 25,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
];

const populateCategories = async () => {
  try {
    for (const category of categories) {
      const categoryRef = doc(db, 'categories', category.id);
      await setDoc(categoryRef, category);
      console.log(`Category ${category.name} added successfully`);
    }
    console.log('All categories have been added successfully');
  } catch (error) {
    console.error('Error adding categories:', error);
  }
};

// Execute the population
populateCategories();