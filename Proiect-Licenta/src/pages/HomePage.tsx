import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Award, MapPin, Search, UserPlus } from 'lucide-react';
import { Hero } from '../components/home/Hero';
import { CategoriiSection } from '../components/home/CategoriiSection';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <div>
      <Hero />
      
      <CategoriiSection />
      
      {/* Cum funcționează */}
      <section id="cum-functioneaza" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Cum funcționează Eventoria</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Procesul nostru simplu îți permite să organizezi evenimentul perfect în doar câțiva pași
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-amber-50 p-6 rounded-lg text-center"
            >
              <div className="bg-amber-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Caută furnizori</h3>
              <p className="text-gray-600">
                Explorează categoriile noastre pentru a găsi serviciile potrivite pentru evenimentul tău.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-amber-50 p-6 rounded-lg text-center"
            >
              <div className="bg-amber-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">2. Rezervă servicii</h3>
              <p className="text-gray-600">
                Compară opțiunile, citește recenzii și alege furnizorii potriviți pentru tine.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-amber-50 p-6 rounded-lg text-center"
            >
              <div className="bg-amber-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Bucură-te de eveniment</h3>
              <p className="text-gray-600">
                Relaxează-te și bucură-te de evenimentul tău perfect organizat cu ajutorul nostru.
              </p>
            </motion.div>

            {!currentUser && (
              <motion.div 
                whileHover={{ y: -10 }}
                className="bg-amber-50 p-6 rounded-lg text-center md:col-span-3"
              >
                <div className="bg-amber-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ești furnizor?</h3>
                <p className="text-gray-600 mb-4">
                  Înscrie-te și începe să primești cereri de la clienți interesați de serviciile tale.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => window.location.href = '/inregistrare'}
                >
                  Înregistrează-te
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </section>
      
      {/* Testimoniale */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ce spun clienții noștri</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Descoperă experiențele reale ale celor care au organizat evenimente cu Eventoria
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Am planificat nunta noastră cu ajutorul Eventoria și totul a fost perfect. Am găsit rapid toți furnizorii de care aveam nevoie și am economisit mult timp."
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold">
                    AM
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium">Ana Mihai</h4>
                  <p className="text-xs text-gray-500">București, Nuntă - Iunie 2025</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Ca furnizor de servicii, Eventoria mi-a ajutat afacerea să crească semnificativ. Platforma este ușor de utilizat și îmi aduce clienți noi în fiecare săptămână."
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold">
                    RD
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium">Radu Dumitrescu</h4>
                  <p className="text-xs text-gray-500">Cluj-Napoca, Fotograf</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center space-x-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                "Am organizat o petrecere corporate pentru compania noastră. Datorită Eventoria, am găsit rapid un loc superb și catering excelent. Recomand cu încredere!"
              </p>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center text-amber-800 font-bold">
                    EP
                  </div>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium">Elena Popescu</h4>
                  <p className="text-xs text-gray-500">Brașov, Petrecere Corporativă</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      {!currentUser && (
        <section className="py-16 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Gata să-ți organizezi evenimentul perfect?</h2>
              <p className="text-lg mb-8 text-amber-100">
                Înscrie-te acum și descoperă cei mai buni furnizori de servicii pentru evenimentul tău.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => window.location.href = '/inregistrare'}
                >
                  Înregistrare Gratuită
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-amber-600"
                  onClick={() => window.location.href = '/despre'}
                >
                  Află mai multe
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;