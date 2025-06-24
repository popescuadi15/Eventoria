import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card } from '../ui/Card';
import type { FirestoreCategory } from '../../types';

export const CategoriiSection: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<(FirestoreCategory & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, 'categories');
        const snapshot = await getDocs(categoriesRef);
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as FirestoreCategory
        }));
        setCategories(categoriesData);
      } catch (err) {
        console.error('Eroare la încărcarea categoriilor:', err);
        setError('Nu am putut încărca categoriile. Vă rugăm încercați din nou mai târziu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
          
          <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="animate-pulse">
                  <div className="h-32 sm:h-48 bg-gray-200"></div>
                  <div className="p-4 sm:p-5">
                    <div className="h-4 sm:h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 lg:py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p className="text-sm sm:text-base">{error}</p>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section id="categorii-section" className="py-8 sm:py-12 lg:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Caută după categorie
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Alege din cele mai populare categorii de servicii pentru evenimentul tău
          </p>
        </div>
        
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={item}>
              <Card 
                animate
                onClick={() => navigate(`/categorii/${category.id}`)}
                className="h-full cursor-pointer hover:shadow-xl transition-all duration-300"
              >
                <div className="h-32 sm:h-48 overflow-hidden">
                  <img 
                    src={category.imageUrl} 
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4 sm:p-5">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {category.name}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-2">
                    {category.description}
                  </p>
                  
                  <div className="mb-3">
                    <p className="text-xs sm:text-sm text-gray-500 mb-1">Subcategorii:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.subcategories.slice(0, 3).map((subcategory, index) => (
                        <span 
                          key={index} 
                          className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full"
                        >
                          {subcategory}
                        </span>
                      ))}
                      {category.subcategories.length > 3 && (
                        <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{category.subcategories.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                    <div className="text-sm sm:text-base text-gray-700">
                      <span className="font-medium">
                        {category.priceRange.min.toLocaleString('ro-RO')} - {category.priceRange.max.toLocaleString('ro-RO')} RON
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="flex text-amber-500">
                        {Array(5).fill(0).map((_, i) => (
                          <svg key={i} className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-1 text-xs sm:text-sm text-gray-600">{category.rating}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};