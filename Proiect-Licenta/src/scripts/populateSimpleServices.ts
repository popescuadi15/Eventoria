import { db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';

// Servicii predefinite pentru fiecare categorie
const servicesData = [
  // Locație Eveniment (category_1)
  {
    categoryId: 'category_1',
    name: 'Castelul Cantacuzino - Busteni',
    description: 'Un castel istoric spectaculos situat în inima Carpaților, oferind o atmosferă regală pentru evenimente de neuitat. Cu săli elegante, grădini întinse și o priveliște magnifică asupra munților, acest loc este perfect pentru nunți de poveste și evenimente exclusive.',
    subcategories: ['Săli de nuntă'],
    tags: ['nunta', 'eveniment-privat'],
    price: { amount: 8500, type: 'per_event' },
    locations: ['Brașov'],
    imageUrl: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg',
    furnizor: 'Castelul Cantacuzino Events',
    numarTelefon: '+40 721 456 789',
    email: 'evenimente@castelulcantacuzino.ro'
  },
  {
    categoryId: 'category_1',
    name: 'Sky Lounge Panoramic',
    description: 'Terasa exclusivistă la etajul 25 cu vedere panoramică asupra orașului București. Spațiul modern și elegant este ideal pentru evenimente corporative, lansări de produse și petreceri private sofisticate.',
    subcategories: ['Spații corporative'],
    tags: ['petrecere-corporativa', 'eveniment-privat'],
    price: { amount: 6200, type: 'per_event' },
    locations: ['București'],
    imageUrl: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg',
    furnizor: 'Sky Lounge Events',
    numarTelefon: '+40 722 567 890',
    email: 'rezervari@skylounge.ro'
  },

  // Fotografie și Video (category_2)
  {
    categoryId: 'category_2',
    name: 'Studio Lumina Artistica',
    description: 'Echipă de fotografi profesioniști specializați în capturarea momentelor speciale cu un stil artistic unic. Folosim echipamente de ultimă generație și tehnici inovatoare pentru a crea imagini care spun povești.',
    subcategories: ['Fotografie de eveniment'],
    tags: ['nunta', 'botez'],
    price: { amount: 2800, type: 'per_event' },
    locations: ['București', 'Iași'],
    imageUrl: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg',
    furnizor: 'Lumina Artistica Studio',
    numarTelefon: '+40 723 678 901',
    email: 'contact@luminaartistica.ro'
  },
  {
    categoryId: 'category_2',
    name: 'CineVision Productions',
    description: 'Creăm filme de eveniment cu calitate cinematografică, transformând momentele tale speciale în opere de artă vizuală. Echipa noastră folosește camere 4K, drone profesionale și echipamente de stabilizare.',
    subcategories: ['Videografie'],
    tags: ['nunta', 'petrecere-corporativa'],
    price: { amount: 3500, type: 'per_event' },
    locations: ['Cluj-Napoca', 'București'],
    imageUrl: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg',
    furnizor: 'CineVision Productions',
    numarTelefon: '+40 724 789 012',
    email: 'hello@cinevision.ro'
  },

  // Muzică și Entertainment (category_3)
  {
    categoryId: 'category_3',
    name: 'DJ Alex Beats',
    description: 'DJ profesionist cu peste 10 ani de experiență în crearea atmosferei perfecte pentru orice tip de eveniment. Repertoriul vast cuprinde toate genurile muzicale, de la hits-uri comerciale la muzică underground selectă.',
    subcategories: ['DJ'],
    tags: ['nunta', 'petrecere-corporativa'],
    price: { amount: 1800, type: 'per_event' },
    locations: ['București', 'Constanța'],
    imageUrl: 'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg',
    furnizor: 'Alex Beats Entertainment',
    numarTelefon: '+40 725 890 123',
    email: 'booking@alexbeats.ro'
  },
  {
    categoryId: 'category_3',
    name: 'Formația Harmony',
    description: 'Formație live versatilă cu 6 membri, specializată în interpretarea unui repertoriu vast de la muzică românească tradițională la hits-uri internaționale contemporane. Experiența noastră de 15 ani garantează profesionalismul.',
    subcategories: ['Formații live'],
    tags: ['nunta', 'botez'],
    price: { amount: 4200, type: 'per_event' },
    locations: ['Iași', 'Galați'],
    imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
    furnizor: 'Formația Harmony',
    numarTelefon: '+40 726 901 234',
    email: 'contact@formatiaharmony.ro'
  },

  // Catering (category_4)
  {
    categoryId: 'category_4',
    name: 'Delice Gourmet Catering',
    description: 'Servicii de catering premium cu bucătari profesioniști specializați în gastronomia internațională și românească rafinată. Meniurile noastre sunt create din ingrediente proaspete, de calitate superioară.',
    subcategories: ['Catering full-service'],
    tags: ['nunta', 'petrecere-corporativa'],
    price: { amount: 180, type: 'per_person' },
    locations: ['București', 'Cluj-Napoca'],
    imageUrl: 'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg',
    furnizor: 'Delice Gourmet Catering',
    numarTelefon: '+40 727 012 345',
    email: 'comenzi@delicegourmet.ro'
  },
  {
    categoryId: 'category_4',
    name: 'Sweet Dreams Patisserie',
    description: 'Cofetărie artizanală specializată în crearea de torturi spectaculoase și deserturi rafinate pentru evenimente speciale. Fiecare creație este realizată manual de către maestrii cofetari.',
    subcategories: ['Cofetărie & Patiserie'],
    tags: ['nunta', 'botez'],
    price: { amount: 85, type: 'per_person' },
    locations: ['Brașov', 'Constanța'],
    imageUrl: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg',
    furnizor: 'Sweet Dreams Patisserie',
    numarTelefon: '+40 728 123 456',
    email: 'comenzi@sweetdreams.ro'
  },

  // Decor și Aranjamente (category_5)
  {
    categoryId: 'category_5',
    name: 'Floral Elegance Studio',
    description: 'Atelier floral specializat în crearea de aranjamente spectaculoase pentru evenimente de toate dimensiunile. Lucrăm exclusiv cu flori proaspete importate și locale de cea mai înaltă calitate.',
    subcategories: ['Florărie'],
    tags: ['nunta', 'cununie'],
    price: { amount: 2200, type: 'per_event' },
    locations: ['București', 'Iași'],
    imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg',
    furnizor: 'Floral Elegance Studio',
    numarTelefon: '+40 729 234 567',
    email: 'comenzi@floralelegance.ro'
  },
  {
    categoryId: 'category_5',
    name: 'Lumina Magică Events',
    description: 'Specialiști în crearea de atmosferă prin iluminat decorativ profesional și efecte speciale luminoase. Transformăm orice spațiu într-un decor de basm folosind tehnologii LED avansate.',
    subcategories: ['Iluminat decorativ'],
    tags: ['nunta', 'petrecere-corporativa'],
    price: { amount: 3200, type: 'per_event' },
    locations: ['Timișoara', 'Craiova'],
    imageUrl: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
    furnizor: 'Lumina Magică Events',
    numarTelefon: '+40 730 345 678',
    email: 'proiecte@luminamagica.ro'
  },

  // Rochii și Costume (category_6)
  {
    categoryId: 'category_6',
    name: 'Atelier Mirabella',
    description: 'Atelier de înaltă couture specializat în crearea de rochii de mireasă unice, realizate pe măsură după cele mai noi tendințe internaționale. Fiecare rochie este o operă de artă.',
    subcategories: ['Rochii de mireasă'],
    tags: ['nunta', 'cununie'],
    price: { amount: 4500, type: 'per_event' },
    locations: ['București', 'Cluj-Napoca'],
    imageUrl: 'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg',
    furnizor: 'Atelier Mirabella',
    numarTelefon: '+40 731 456 789',
    email: 'comenzi@ateliermirabella.ro'
  },
  {
    categoryId: 'category_6',
    name: 'Gentleman\'s Choice',
    description: 'Magazin specializat în costume de ceremonie pentru bărbați, oferind o gamă completă de la costume clasice la modele contemporane de designer. Consultanță de stil gratuită.',
    subcategories: ['Costume pentru miri'],
    tags: ['nunta', 'petrecere-corporativa'],
    price: { amount: 1800, type: 'per_event' },
    locations: ['Brașov', 'Iași'],
    imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
    furnizor: 'Gentleman\'s Choice',
    numarTelefon: '+40 732 567 890',
    email: 'contact@gentlemanschoice.ro'
  }
];

const populateSimpleServices = async () => {
  try {
    console.log('🚀 Începe popularea serviciilor...');
    
    let successCount = 0;
    let errorCount = 0;

    for (const service of servicesData) {
      try {
        const serviceId = `service_${service.categoryId}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        const serviceData = {
          name: service.name,
          description: service.description,
          categoryRef: doc(db, 'categories', service.categoryId),
          subcategories: service.subcategories,
          tags: service.tags,
          price: service.price,
          locations: service.locations,
          date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          imageUrl: service.imageUrl,
          furnizor: service.furnizor,
          numarTelefon: service.numarTelefon,
          email: service.email,
          userId: 'demo_vendor_' + Math.random().toString(36).substr(2, 9),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'active'
        };

        await setDoc(doc(db, 'events', serviceId), serviceData);
        console.log(`✅ Adăugat: ${service.name}`);
        successCount++;
        
        // Pauză scurtă între adăugări
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Eroare la ${service.name}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Populare completă!`);
    console.log(`✅ Servicii adăugate cu succes: ${successCount}`);
    console.log(`❌ Erori: ${errorCount}`);
    
  } catch (error) {
    console.error('❌ Eroare generală:', error);
  }
};

// Execută scriptul
populateSimpleServices();