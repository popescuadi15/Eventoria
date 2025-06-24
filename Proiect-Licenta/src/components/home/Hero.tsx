import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

const EVENT_TAGS = [
  { id: 'nunta', label: 'Nuntă' },
  { id: 'botez', label: 'Botez' },
  { id: 'cununie', label: 'Cununie' },
  { id: 'eveniment-privat', label: 'Eveniment Privat' },
  { id: 'eveniment-sportiv', label: 'Eveniment Sportiv' },
  { id: 'festival', label: 'Festival' },
  { id: 'inaugurare', label: 'Inaugurare' },
  { id: 'petrecere-copii', label: 'Petrecere pentru Copii' },
  { id: 'petrecere-corporativa', label: 'Petrecere Corporativă' },
  { id: 'revelion', label: 'Revelion' },
  { id: 'zilele-orasului', label: 'Zilele Orașului' }
];

const CITIES = [
  'Toate locațiile',
  'București',
  'Cluj-Napoca',
  'Iași',
  'Timișoara',
  'Brașov'
];

export const Hero: React.FC = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedCity, setSelectedCity] = useState('Toate locațiile');

  const handleTagSelect = (tagId: string) => {
    setSelectedTag(tagId);
    setIsDropdownOpen(false);
  };

  const handleSearch = () => {
    if (selectedTag) {
      const searchParams = new URLSearchParams();
      if (selectedCity !== 'Toate locațiile') {
        searchParams.append('city', selectedCity);
      }
      navigate(`/evenimente/${selectedTag}?${searchParams.toString()}`);
    }
  };

  return (
    <div className="relative h-[70vh] min-h-[500px] bg-black">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 z-10"></div>
        <img 
          src="https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg" 
          alt="Eveniment elegant"
          className="object-cover w-full h-full opacity-70"
        />
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 h-full flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Organizează evenimente memorabile cu Eventoria
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              Descoperă cei mai buni furnizori pentru evenimentul tău și creează amintiri de neuitat.
            </p>
            
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-left flex items-center justify-between hover:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <span className="text-gray-500">
                      {selectedTag ? EVENT_TAGS.find(tag => tag.id === selectedTag)?.label : 'Ce tip de eveniment organizezi?'}
                    </span>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
                      <div className="py-1 max-h-60 overflow-auto">
                        {EVENT_TAGS.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => handleTagSelect(tag.id)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-900"
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow sm:flex-grow-0">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500"
                  >
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <Button 
                  variant="primary"
                  onClick={handleSearch}
                  disabled={!selectedTag}
                >
                  Caută
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};