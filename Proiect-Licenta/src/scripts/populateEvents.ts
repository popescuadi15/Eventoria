import { db } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const events = [
  {
    id: 'event_1',
    name: 'Nuntă de Poveste la Palatul Bragadiru',
    description: 'Organizăm nunți de vis într-un cadru istoric spectaculos. Palatul Bragadiru oferă o atmosferă regală și servicii premium pentru evenimentul tău special.',
    category: 'category_1',
    subcategory: 'Săli de nuntă',
    tags: ['nunta', 'elegant', 'istoric'],
    price: 15000,
    location: 'București',
    date: new Date('2024-08-15'),
    imageUrl: 'https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg',
    furnizor: 'Palatul Bragadiru',
    numarTelefon: '+40 721 234 567',
    email: 'contact@palatulbragadiru.ro',
    createdAt: serverTimestamp()
  },
  {
    id: 'event_2',
    name: 'Garden Party Corporate',
    description: 'Organizăm evenimente corporate în aer liber, într-un cadru natural spectaculos. Grădina noastră oferă spațiul perfect pentru team building-uri și petreceri corporate.',
    category: 'category_1',
    subcategory: 'Grădini și terase',
    tags: ['corporate', 'outdoor', 'networking'],
    price: 8000,
    location: 'București',
    date: new Date('2024-07-20'),
    imageUrl: 'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg',
    furnizor: 'Garden Events',
    numarTelefon: '+40 722 345 678',
    email: 'contact@gardenevents.ro',
    createdAt: serverTimestamp()
  },
  {
    id: 'event_3',
    name: 'Conferință Tech Innovation 2024',
    description: 'Cea mai mare conferință de tehnologie din România. Spațiu modern, echipamente de ultimă generație și facilități premium pentru prezentări și networking.',
    category: 'category_1',
    subcategory: 'Săli de conferințe',
    tags: ['conferinta', 'tech', 'business'],
    price: 5000,
    location: 'Cluj-Napoca',
    date: new Date('2024-09-10'),
    imageUrl: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg',
    furnizor: 'Business Center Premium',
    numarTelefon: '+40 723 456 789',
    email: 'events@businesscenter.ro',
    createdAt: serverTimestamp()
  }
];

const populateEvents = async () => {
  try {
    for (const event of events) {
      const eventRef = doc(db, 'events', event.id);
      await setDoc(eventRef, event);
      console.log(`Event ${event.name} added successfully`);
    }
    console.log('All events have been added successfully');
  } catch (error) {
    console.error('Error adding events:', error);
  }
};

// Execute the population
populateEvents();