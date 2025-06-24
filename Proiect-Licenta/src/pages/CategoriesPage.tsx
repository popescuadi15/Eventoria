import React from 'react';
import { CategoriiSection } from '../components/home/CategoriiSection';

const CategoriesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Categorii</h1>
        <p className="text-lg text-gray-600 mb-8">
          Explorează toate categoriile de servicii disponibile pentru evenimentul tău
        </p>
      </div>
      <CategoriiSection />
    </div>
  );
};

export default CategoriesPage;