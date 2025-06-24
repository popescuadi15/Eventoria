import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Calendar, Filter, Star, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FavoriteButton } from '../components/events/FavoriteButton';
import type { FirestoreCategory } from '../types';

const EVENT_TAGS = {
  'nunta': 'Nuntă',
  'botez': 'Botez',
  'cununie': 'Cununie',
  'eveniment-privat': 'Eveniment Privat',
  'eveniment-sportiv': 'Eveniment Sportiv',
  'festival': 'Festival',
  'inaugurare': 'Inaugurare',
  'petrecere-copii': 'Petrecere pentru Copii',
  'petrecere-corporativa': 'Petrecere Corporativă',
  'revelion': 'Revelion',
  'zilele-orasului': 'Zilele Orașului'
};

interface Event {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryRef: any;
  subcategories: string[];
  tags: string[];
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  locations: string[];
  date: Date;
  imageUrl: string;
  furnizor: string;
  createdAt: Date;
  rating?: number;
  status?: string;
}

const CITIES = [
  'Toate orașele',
  'București',
  'Cluj-Napoca',
  'Timișoara',
  'Iași',
  'Brașov'
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'price_asc', label: 'Preț: de la mic la mare' },
  { value: 'price_desc', label: 'Preț: de la mare la mic' },
  { value: 'name_asc', label: 'Nume: A-Z' },
  { value: 'name_desc', label: 'Nume: Z-A' },
  { value: 'rating_asc', label: 'Rating: de la mic la mare' },
  { value: 'rating_desc', label: 'Rating: de la mare la mic' }
];

const TagEventsPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const cityFromUrl = searchParams.get('city');
  
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<(FirestoreCategory & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState(cityFromUrl || 'Toate orașele');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

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
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const eventsRef = collection(db, 'events');
        
        let eventsQuery = query(
          eventsRef,
          where('tags', 'array-contains', tagId)
        );

        const snapshot = await getDocs(eventsQuery);
        const allEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate(),
          createdAt: doc.data().createdAt?.toDate(),
          rating: doc.data().rating || (Math.random() * 2 + 3),
          status: doc.data().status || 'active'
        })) as Event[];

        const activeEvents = allEvents.filter(event => event.status === 'active');
        setEvents(activeEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('A apărut o eroare la încărcarea evenimentelor');
      } finally {
        setLoading(false);
      }
    };

    if (tagId) {
      fetchEvents();
    }
  }, [tagId]);

  const sortEvents = (eventsToSort: Event[]) => {
    const sorted = [...eventsToSort];
    
    switch (sortBy) {
      case 'price_asc':
        return sorted.sort((a, b) => a.price.amount - b.price.amount);
      case 'price_desc':
        return sorted.sort((a, b) => b.price.amount - a.price.amount);
      case 'name_asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ro'));
      case 'name_desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name, 'ro'));
      case 'rating_asc':
        return sorted.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'rating_desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  };

  const filteredEvents = sortEvents(events.filter(event => {
    const matchesSearch = !searchQuery || 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.furnizor.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = selectedCity === 'Toate orașele' || 
      event.locations.some(location => location.includes(selectedCity));

    const matchesCategory = selectedCategory === 'all' || 
      (event.categoryRef && event.categoryRef.id === selectedCategory);

    const matchesPrice = event.price.amount >= priceRange.min && 
      event.price.amount <= priceRange.max;

    const matchesRating = !ratingFilter || (event.rating || 0) >= ratingFilter;

    return matchesSearch && matchesCity && matchesCategory && matchesPrice && matchesRating;
  }));

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('Toate orașele');
    setSelectedCategory('all');
    setPriceRange({ min: 0, max: 10000 });
    setRatingFilter(0);
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center text-red-600">
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="mt-4"
          >
            Încearcă din nou
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-amber-600 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4">
            Evenimente de tip {EVENT_TAGS[tagId as keyof typeof EVENT_TAGS]?.toLowerCase()}
          </h1>
          <p className="text-lg sm:text-xl text-amber-100">
            Descoperă cele mai bune servicii pentru {EVENT_TAGS[tagId as keyof typeof EVENT_TAGS]?.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Search Filters - Non-sticky on mobile */}
      <div className="bg-white shadow-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Main Search Bar */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Caută în evenimente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* City Filter */}
              <div className="relative flex-1 sm:flex-none sm:w-48">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 text-base border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white"
                >
                  {CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
              </div>

              {/* Sort Filter */}
              <div className="relative flex-1 sm:flex-none sm:w-56">
                <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 text-base border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
              </div>

              {/* Advanced Filters Toggle */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 py-3 px-4 text-base"
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filtre avansate</span>
                <span className="sm:hidden">Filtre</span>
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 bg-gray-50 rounded-lg p-4 border"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Filtre avansate</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors sm:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categorie
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value="all">Toate categoriile</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interval preț (RON)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating minim
                  </label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(Number(e.target.value))}
                    className="w-full px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                  >
                    <option value={0}>Toate rating-urile</option>
                    <option value={1}>1+ stele</option>
                    <option value={2}>2+ stele</option>
                    <option value={3}>3+ stele</option>
                    <option value={4}>4+ stele</option>
                    <option value={5}>5 stele</option>
                  </select>
                  <div className="flex items-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingFilter(star)}
                        className={`p-1 ${ratingFilter >= star ? 'text-amber-500' : 'text-gray-300'}`}
                      >
                        <Star className="w-5 h-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset Filters */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full"
                  >
                    Resetează filtrele
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Results Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 mt-4 gap-2">
            <span>
              {filteredEvents.length} servicii găsite
            </span>
            <span className="text-xs sm:text-sm">
              Sortare: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Categories Sidebar - Hidden on mobile when filters are open */}
          <div className={`lg:w-64 flex-shrink-0 ${showFilters ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-lg shadow-lg p-6 lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold mb-4">Categorii</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-amber-100 text-amber-900' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Toate categoriile
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-amber-100 text-amber-900' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                    <div className="h-48 relative overflow-hidden rounded-t-lg">
                      <img 
                        src={event.imageUrl} 
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      <div className="absolute top-2 right-2">
                        <FavoriteButton 
                          eventId={event.id} 
                          eventName={event.name}
                          size="sm"
                        />
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="mb-3">
                          {event.subcategories?.map((subcategory, index) => (
                            <span key={index} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mr-2">
                              {subcategory}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span className="text-sm font-medium">
                            {event.rating?.toFixed(1) || '4.5'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      
                      <div className="space-y-2 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {event.locations.join(', ')}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(event.date).toLocaleDateString('ro-RO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-lg font-semibold text-amber-600">
                          {event.price.amount.toLocaleString('ro-RO')} RON
                          <span className="text-sm text-gray-500 ml-1">
                            {event.price.type === 'per_hour' && '/ oră'}
                            {event.price.type === 'per_person' && '/ persoană'}
                            {event.price.type === 'per_event' && '/ eveniment'}
                          </span>
                        </div>
                        <button 
                          onClick={() => navigate(`/eveniment/${event.id}`)}
                          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors"
                        >
                          Vezi detalii
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <div className="mb-6">
                  <Search className="w-16 h-16 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nu am găsit servicii
                </h3>
                <p className="text-gray-600 mb-6">
                  Nu am găsit servicii care să corespundă criteriilor tale de căutare.
                </p>
                <Button
                  variant="outline"
                  onClick={resetFilters}
                >
                  Resetează filtrele
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagEventsPage;