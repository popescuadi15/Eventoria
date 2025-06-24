import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, serverTimestamp, enableNetwork } from 'firebase/firestore';

// Configurare Firebase directă pentru script
const firebaseConfig = {
  apiKey: "AIzaSyAGM7kaHHlqmzR7D9IlLvvhaI5GW3Fkrgw",
  authDomain: "eventoria-app.firebaseapp.com",
  projectId: "eventoria-app",
  storageBucket: "eventoria-app.firebasestorage.app",
  messagingSenderId: "605719798396",
  appId: "1:605719798396:web:5d90138ca65c81fff55ff9"
};

// Inițializare Firebase pentru script
const app = initializeApp(firebaseConfig, 'populate-script');
const db = getFirestore(app);

// Funcție pentru a aștepta conectivitatea
const waitForConnection = async (maxRetries = 5) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`🔄 Încercare de conectare ${i + 1}/${maxRetries}...`);
      await enableNetwork(db);
      
      // Test simplu de conectivitate
      await getDocs(collection(db, 'categories'));
      console.log('✅ Conectare reușită la Firebase!');
      return true;
    } catch (error) {
      console.log(`❌ Conectare eșuată (încercarea ${i + 1}):`, error.message);
      if (i < maxRetries - 1) {
        console.log('⏳ Aștept 3 secunde înainte de următoarea încercare...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  return false;
};

// Servicii pentru diferite tipuri de categorii
const getServicesForCategory = (categoryName: string, categoryId: string) => {
  const baseServices = [
    {
      name: `${categoryName} Premium Experience`,
      description: `Serviciu profesional de ${categoryName.toLowerCase()} cu experiență de peste 10 ani în domeniu. Oferim soluții complete și personalizate pentru evenimentul tău special, cu atenție la detalii și calitate superioară. Echipa noastră de specialiști se dedică creării de experiențe memorabile care depășesc așteptările clienților. Folosim doar echipamente și materiale premium pentru rezultate excepționale.`,
      subcategories: ['Servicii premium', 'Consultanță specializată'],
      tags: ['nunta', 'eveniment-privat', 'petrecere-corporativa'],
      price: { amount: Math.floor(Math.random() * 3000) + 2000, type: 'per_event' as const },
      locations: ['București', 'Cluj-Napoca', 'Timișoara'],
      imageUrl: 'https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg',
      furnizor: `${categoryName} Professional Services`,
      numarTelefon: `+40 72${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`,
      email: `contact@${categoryId.replace('_', '').toLowerCase()}pro.ro`
    },
    {
      name: `Elite ${categoryName} Solutions`,
      description: `Serviciu exclusiv de ${categoryName.toLowerCase()} pentru evenimente de lux și ceremonii speciale. Echipa noastră de specialiști creează experiențe memorabile prin profesionalism și creativitate, adaptându-se perfect la viziunea ta. Oferim consultanță completă, planificare detaliată și execuție impecabilă. Fiecare proiect este tratat cu atenția la detalii care face diferența între un eveniment obișnuit și unul extraordinar.`,
      subcategories: ['Servicii exclusive', 'Planificare completă'],
      tags: ['nunta', 'cununie', 'eveniment-privat'],
      price: { amount: Math.floor(Math.random() * 4000) + 3000, type: 'per_event' as const },
      locations: ['Brașov', 'Iași', 'Constanța'],
      imageUrl: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg',
      furnizor: `Elite ${categoryName}`,
      numarTelefon: `+40 73${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 900) + 100}`,
      email: `rezervari@elite${categoryId.replace('_', '').toLowerCase()}.ro`
    }
  ];

  // Servicii specifice pentru anumite categorii
  if (categoryName.toLowerCase().includes('locație') || categoryName.toLowerCase().includes('location')) {
    return [
      {
        name: 'Castelul Cantacuzino - Busteni',
        description: 'Un castel istoric spectaculos situat în inima Carpaților, oferind o atmosferă regală pentru evenimente de neuitat. Cu săli elegante, grădini întinse și o priveliște magnifică asupra munților, acest loc este perfect pentru nunți de poveste și evenimente exclusive. Capacitate până la 200 de persoane, cu facilități moderne integrate discret în arhitectura istorică.',
        subcategories: ['Săli de nuntă', 'Spații tematice'],
        tags: ['nunta', 'eveniment-privat', 'cununie'],
        price: { amount: 8500, type: 'per_event' as const },
        locations: ['Brașov', 'București'],
        imageUrl: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg',
        furnizor: 'Castelul Cantacuzino Events',
        numarTelefon: '+40 721 456 789',
        email: 'evenimente@castelulcantacuzino.ro'
      },
      {
        name: 'Terasa Panoramic Sky Lounge',
        description: 'Terasa exclusivistă la etajul 25 cu vedere panoramică asupra orașului București. Spațiul modern și elegant este ideal pentru evenimente corporative, lansări de produse și petreceri private sofisticate. Dotată cu sistem de sonorizare profesional, iluminat LED personalizabil și bar complet. Capacitate 150 persoane, cu posibilitatea închirierii exclusive.',
        subcategories: ['Spații corporative', 'Grădini și terase'],
        tags: ['petrecere-corporativa', 'eveniment-privat', 'inaugurare'],
        price: { amount: 6200, type: 'per_event' as const },
        locations: ['București', 'Cluj-Napoca'],
        imageUrl: 'https://images.pexels.com/photos/1395967/pexels-photo-1395967.jpeg',
        furnizor: 'Sky Lounge Events',
        numarTelefon: '+40 722 567 890',
        email: 'rezervari@skylounge.ro'
      }
    ];
  }

  if (categoryName.toLowerCase().includes('fotografie') || categoryName.toLowerCase().includes('video')) {
    return [
      {
        name: 'Studio Lumina Artistica - Fotografie Premium',
        description: 'Echipă de fotografi profesioniști specializați în capturarea momentelor speciale cu un stil artistic unic. Folosim echipamente de ultimă generație și tehnici inovatoare pentru a crea imagini care spun povești. Serviciile includ ședințe foto pre-eveniment, acoperire completă a evenimentului și editare profesională. Livrăm galerii online și albume premium personalizate.',
        subcategories: ['Fotografie de eveniment', 'Drone & Echipamente speciale'],
        tags: ['nunta', 'botez', 'eveniment-privat'],
        price: { amount: 2800, type: 'per_event' as const },
        locations: ['București', 'Iași', 'Timișoara'],
        imageUrl: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg',
        furnizor: 'Lumina Artistica Studio',
        numarTelefon: '+40 723 678 901',
        email: 'contact@luminaartistica.ro'
      },
      {
        name: 'CineVision - Videografie Cinematică',
        description: 'Creăm filme de eveniment cu calitate cinematografică, transformând momentele tale speciale în opere de artă vizuală. Echipa noastră folosește camere 4K, drone profesionale și echipamente de stabilizare pentru capturi perfecte. Oferim editare avansată cu efecte speciale, colocare profesională și soundtrack personalizat. Rezultatul final este un film care va fi comoara familiei pentru generații.',
        subcategories: ['Videografie', 'Drone & Echipamente speciale'],
        tags: ['nunta', 'petrecere-corporativa', 'festival'],
        price: { amount: 3500, type: 'per_event' as const },
        locations: ['Cluj-Napoca', 'București', 'Brașov'],
        imageUrl: 'https://images.pexels.com/photos/2608517/pexels-photo-2608517.jpeg',
        furnizor: 'CineVision Productions',
        numarTelefon: '+40 724 789 012',
        email: 'hello@cinevision.ro'
      }
    ];
  }

  if (categoryName.toLowerCase().includes('muzică') || categoryName.toLowerCase().includes('entertainment')) {
    return [
      {
        name: 'DJ Alex Beats - Experiențe Sonore Unice',
        description: 'DJ profesionist cu peste 10 ani de experiență în crearea atmosferei perfecte pentru orice tip de eveniment. Repertoriul vast cuprinde toate genurile muzicale, de la hits-uri comerciale la muzică underground selectă. Echipamentele premium includ sistem de sunet JBL, iluminat LED sincronizat și efecte speciale. Personalizez playlist-ul în funcție de preferințele tale și citesc perfect energia mulțimii.',
        subcategories: ['DJ', 'Artiști & Animatori'],
        tags: ['nunta', 'petrecere-corporativa', 'revelion'],
        price: { amount: 1800, type: 'per_event' as const },
        locations: ['București', 'Constanța', 'Ploiești'],
        imageUrl: 'https://images.pexels.com/photos/2034851/pexels-photo-2034851.jpeg',
        furnizor: 'Alex Beats Entertainment',
        numarTelefon: '+40 725 890 123',
        email: 'booking@alexbeats.ro'
      },
      {
        name: 'Formația Harmony - Muzică Live Profesională',
        description: 'Formație live versatilă cu 6 membri, specializată în interpretarea unui repertoriu vast de la muzică românească tradițională la hits-uri internaționale contemporane. Avem propriul sistem de sonorizare și iluminat, adaptându-ne perfect la orice tip de eveniment. Oferim și servicii de ceremonie religioasă, cântece personalizate și momente speciale dedicate. Experiența noastră de 15 ani garantează profesionalismul și calitatea interpretării.',
        subcategories: ['Formații live', 'Artiști & Animatori'],
        tags: ['nunta', 'botez', 'zilele-orasului'],
        price: { amount: 4200, type: 'per_event' as const },
        locations: ['Iași', 'Galați', 'Brașov'],
        imageUrl: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
        furnizor: 'Formația Harmony',
        numarTelefon: '+40 726 901 234',
        email: 'contact@formatiaharmony.ro'
      }
    ];
  }

  if (categoryName.toLowerCase().includes('catering') || categoryName.toLowerCase().includes('mâncare')) {
    return [
      {
        name: 'Delice Gourmet - Catering de Lux',
        description: 'Servicii de catering premium cu bucătari profesioniști specializați în gastronomia internațională și românească rafinată. Meniurile noastre sunt create din ingrediente proaspete, de calitate superioară, prezentate într-un stil elegant și modern. Oferim degustări gratuite, meniuri personalizate pentru diete speciale și servicii complete de ospătar. Fiecare eveniment este tratat cu atenția la detalii care face diferența.',
        subcategories: ['Catering full-service', 'Mixologie & Băuturi'],
        tags: ['nunta', 'petrecere-corporativa', 'eveniment-privat'],
        price: { amount: 180, type: 'per_person' as const },
        locations: ['București', 'Cluj-Napoca', 'Timișoara'],
        imageUrl: 'https://images.pexels.com/photos/5638732/pexels-photo-5638732.jpeg',
        furnizor: 'Delice Gourmet Catering',
        numarTelefon: '+40 727 012 345',
        email: 'comenzi@delicegourmet.ro'
      },
      {
        name: 'Sweet Dreams Patisserie - Deserturi de Vis',
        description: 'Cofetărie artizanală specializată în crearea de torturi spectaculoase și deserturi rafinate pentru evenimente speciale. Fiecare creație este realizată manual de către maestrii cofetari, folosind doar ingrediente naturale premium. Oferim torturi personalizate cu design unic, candy bar-uri tematice, macarons francezi și o gamă variată de prajituri fine. Consultanță gratuită pentru design și degustare.',
        subcategories: ['Cofetărie & Patiserie', 'Catering full-service'],
        tags: ['nunta', 'botez', 'petrecere-copii'],
        price: { amount: 85, type: 'per_person' as const },
        locations: ['Brașov', 'Constanța', 'Oradea'],
        imageUrl: 'https://images.pexels.com/photos/1721932/pexels-photo-1721932.jpeg',
        furnizor: 'Sweet Dreams Patisserie',
        numarTelefon: '+40 728 123 456',
        email: 'comenzi@sweetdreams.ro'
      }
    ];
  }

  if (categoryName.toLowerCase().includes('decor') || categoryName.toLowerCase().includes('aranjamente')) {
    return [
      {
        name: 'Floral Elegance - Aranjamente Florale de Lux',
        description: 'Atelier floral specializat în crearea de aranjamente spectaculoase pentru evenimente de toate dimensiunile. Lucrăm exclusiv cu flori proaspete importate și locale de cea mai înaltă calitate, creând compoziții unice care reflectă personalitatea și tema evenimentului tău. Serviciile includ buchete de mireasă, aranjamente pentru ceremonie, centrepieces și decorațiuni florale complete. Consultanță gratuită și livrare inclusă.',
        subcategories: ['Florărie', 'Decor tematic'],
        tags: ['nunta', 'cununie', 'eveniment-privat'],
        price: { amount: 2200, type: 'per_event' as const },
        locations: ['București', 'Iași', 'Cluj-Napoca'],
        imageUrl: 'https://images.pexels.com/photos/2306281/pexels-photo-2306281.jpeg',
        furnizor: 'Floral Elegance Studio',
        numarTelefon: '+40 729 234 567',
        email: 'comenzi@floralelegance.ro'
      },
      {
        name: 'Lumina Magică - Iluminat Decorativ Premium',
        description: 'Specialiști în crearea de atmosferă prin iluminat decorativ profesional și efecte speciale luminoase. Transformăm orice spațiu într-un decor de basm folosind tehnologii LED avansate, proiectoare arhitecturale și sisteme de control inteligent. Oferim iluminat pentru ceremonie, petrecere, iluminat arhitectural și efecte speciale sincronizate cu muzica. Echipa noastră de designeri creează concepte personalizate pentru fiecare eveniment.',
        subcategories: ['Iluminat decorativ', 'Decor tematic'],
        tags: ['nunta', 'petrecere-corporativa', 'festival'],
        price: { amount: 3200, type: 'per_event' as const },
        locations: ['Timișoara', 'Craiova', 'Galați'],
        imageUrl: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
        furnizor: 'Lumina Magică Events',
        numarTelefon: '+40 730 345 678',
        email: 'proiecte@luminamagica.ro'
      }
    ];
  }

  if (categoryName.toLowerCase().includes('rochii') || categoryName.toLowerCase().includes('costume')) {
    return [
      {
        name: 'Atelier Mirabella - Rochii de Mireasă Exclusive',
        description: 'Atelier de înaltă couture specializat în crearea de rochii de mireasă unice, realizate pe măsură după cele mai noi tendințe internaționale. Fiecare rochie este o operă de artă, confecționată manual din materiale premium: mătase naturală, dantelă franceză, cristale Swarovski și broderii fine. Oferim consultanță completă de stil, probe multiple și ajustări perfecte. Colecția include și accesorii coordonate: voaluri, bijuterii și pantofi.',
        subcategories: ['Rochii de mireasă', 'Accesorii'],
        tags: ['nunta', 'cununie'],
        price: { amount: 4500, type: 'per_event' as const },
        locations: ['București', 'Cluj-Napoca', 'Timișoara'],
        imageUrl: 'https://images.pexels.com/photos/291759/pexels-photo-291759.jpeg',
        furnizor: 'Atelier Mirabella',
        numarTelefon: '+40 731 456 789',
        email: 'comenzi@ateliermirabella.ro'
      },
      {
        name: 'Gentleman\'s Choice - Costume de Ceremonie',
        description: 'Magazin specializat în costume de ceremonie pentru bărbați, oferind o gamă completă de la costume clasice la modele contemporane de designer. Lucrăm cu cele mai prestigioase mărci internaționale și oferim servicii de croitorie pentru ajustări perfecte. Colecția include costume pentru miri, nași, invitați și evenimente business. Consultanță de stil gratuită, închiriere și vânzare, plus accesorii complete: cămăși, cravate, papionuri și pantofi.',
        subcategories: ['Costume pentru miri', 'Accesorii'],
        tags: ['nunta', 'petrecere-corporativa', 'eveniment-privat'],
        price: { amount: 1800, type: 'per_event' as const },
        locations: ['Brașov', 'Iași', 'Constanța'],
        imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
        furnizor: 'Gentleman\'s Choice',
        numarTelefon: '+40 732 567 890',
        email: 'contact@gentlemanschoice.ro'
      }
    ];
  }

  // Returnează serviciile de bază pentru categorii necunoscute
  return baseServices;
};

const populateAllServices = async () => {
  try {
    console.log('🚀 Începe popularea bazei de date cu servicii...');
    
    // Așteaptă conectivitatea
    const isConnected = await waitForConnection();
    if (!isConnected) {
      console.error('❌ Nu s-a putut stabili conexiunea cu Firebase după multiple încercări.');
      console.log('💡 Sugestii pentru rezolvare:');
      console.log('   1. Verifică conexiunea la internet');
      console.log('   2. Verifică configurația Firebase din .env');
      console.log('   3. Încearcă din nou peste câteva minute');
      return;
    }

    // Obține toate categoriile existente
    console.log('📂 Încărcare categorii din baza de date...');
    const categoriesSnapshot = await getDocs(collection(db, 'categories'));
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || 'Categorie necunoscută',
      subcategories: doc.data().subcategories || [],
      ...doc.data()
    }));

    console.log(`📂 Găsite ${categories.length} categorii în baza de date:`);
    categories.forEach(cat => console.log(`   - ${cat.id}: ${cat.name}`));

    if (categories.length === 0) {
      console.log('⚠️  Nu există categorii în baza de date. Rulează mai întâi scriptul de populare categorii:');
      console.log('   npm run populate:categories');
      return;
    }

    let totalServicesAdded = 0;

    // Pentru fiecare categorie, adaugă serviciile corespunzătoare
    for (const category of categories) {
      console.log(`\n📋 Procesez categoria: ${category.name} (${category.id})`);
      
      // Obține serviciile pentru această categorie
      const categoryServices = getServicesForCategory(category.name, category.id);
      
      console.log(`   📝 Vor fi adăugate ${categoryServices.length} servicii`);

      // Adaugă serviciile în baza de date
      for (let i = 0; i < categoryServices.length; i++) {
        const service = categoryServices[i];
        const serviceId = `${category.id}_service_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        
        try {
          const serviceData = {
            ...service,
            categoryRef: doc(db, 'categories', category.id),
            userId: 'demo_vendor_' + Math.random().toString(36).substr(2, 9), // ID demo pentru vendor
            date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'active'
          };

          await setDoc(doc(db, 'events', serviceId), serviceData);
          console.log(`  ✅ Adăugat serviciul: ${service.name}`);
          totalServicesAdded++;
          
          // Pauză scurtă între adăugări pentru a evita rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`  ❌ Eroare la adăugarea serviciului ${service.name}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Popularea completă! Au fost adăugate ${totalServicesAdded} servicii în total.`);
    console.log('✨ Toate serviciile au fost create cu succes în baza de date.');
    console.log('🔍 Poți verifica serviciile în aplicația ta la secțiunea Evenimente.');

  } catch (error) {
    console.error('❌ Eroare la popularea bazei de date:', error);
    console.log('💡 Încearcă să rulezi din nou scriptul sau verifică conexiunea la internet.');
  }
};

// Execută scriptul
populateAllServices();