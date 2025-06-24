import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, limit, startAfter, getDocs, where } from 'firebase/firestore';
import { MapPin, Calendar, Clock, ArrowRight, Search, Filter, SlidersHorizontal, Star, ChevronDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { FavoriteButton } from '../components/events/FavoriteButton';
import type { FirestoreCategory } from '../types';

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

const EVENTS_PER_PAGE = 20;

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

const EventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<(FirestoreCategory & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Toate orașele');
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

  const fetchEvents = async (isLoadingMore = false) => {
    try {
      if (isLoadingMore) {
        setLoadingMore(true);
      }

      let eventsQuery = query(
        collection(db, 'events'),
        orderBy('createdAt', 'desc'),
        limit(EVENTS_PER_PAGE)
      );

      if (isLoadingMore && lastVisible) {
        eventsQuery = query(
          collection(db, 'events'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(EVENTS_PER_PAGE)
        );
      }

      const snapshot = await getDocs(eventsQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
        return;
      }

      const allEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
        rating: doc.data().rating || (Math.random() * 2 + 3),
        status: doc.data().status || 'active'
      })) as Event[];

      const activeEvents = allEvents.filter(event => event.status === 'active');

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      
      if (isLoadingMore) {
        setEvents(prev => [...prev, ...activeEvents]);
      } else {
        setEvents(activeEvents);
      }

      setHasMore(snapshot.docs.length === EVENTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('A apărut o eroare la încărcarea evenimentelor');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex gap-8">
                <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                fetchEvents();
              }}
              className="mt-4"
            >
              Încearcă din nou
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg)',
            transform: 'scale(1.1)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50"></div>
        </div>
        <div className="relative h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 sm:mb-6">
                Servicii <span className="text-amber-500">Memorabile</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-200 max-w-2xl">
                Descoperă cele mai noi și interesante servicii oferite de furnizori profesioniști
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search and Filters - Non-sticky on mobile */}
      <div className="bg-white shadow-lg border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Main Search Bar */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Caută servicii..."
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
                <span className="hidden sm:inline">Filtre</span>
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
              {searchQuery && ` pentru "${searchQuery}"`}
            </span>
            <span className="text-xs sm:text-sm">
              Sortare: {SORT_OPTIONS.find(opt => opt.value === sortBy)?.label}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            <div className="space-y-8 sm:space-y-12">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group relative"
                >
                  <Card 
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/eveniment/${event.id}`)}
                  >
                    <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
                      <div className="md:w-1/3 lg:w-2/5 relative">
                        <div className="w-full h-48 md:h-64 overflow-hidden">
                          <img 
                            src={event.imageUrl} 
                            alt={event.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="absolute top-4 right-4">
                          <FavoriteButton 
                            eventId={event.id} 
                            eventName={event.name}
                            className="bg-white/90 hover:bg-white shadow-lg"
                          />
                        </div>
                      </div>

                      <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                              {event.name}
                            </h2>
                            <div className="flex items-center gap-1">
                              <Star className="w-5 h-5 text-amber-500 fill-current" />
                              <span className="text-lg font-semibold text-gray-900">
                                {event.rating?.toFixed(1) || '4.5'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-6 line-clamp-2">
                            {event.description}
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center text-gray-600">
                              <MapPin className="w-5 h-5 mr-2 text-amber-500" />
                              {event.locations.join(', ')}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Calendar className="w-5 h-5 mr-2 text-amber-500" />
                              {new Date(event.date).toLocaleDateString('ro-RO', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Clock className="w-5 h-5 mr-2 text-amber-500" />
                              Program: 10:00 - 22:00
                            </div>
                            <div className="flex items-center text-amber-600 font-semibold">
                              {event.price.amount.toLocaleString('ro-RO')} RON
                              <span className="text-sm text-gray-500 ml-1">
                                {event.price.type === 'per_hour' && '/ oră'}
                                {event.price.type === 'per_person' && '/ persoană'}
                                {event.price.type === 'per_event' && '/ eveniment'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            {event.tags?.slice(0, 3).map((tag) => (
                              <span 
                                key={tag}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                          <ArrowRight className="w-6 h-6 text-amber-500 transform group-hover:translate-x-2 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}

              {hasMore && (
                <motion.div 
                  className="flex justify-center mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => fetchEvents(true)}
                    disabled={loadingMore}
                    className="px-8 py-3 text-lg"
                  >
                    {loadingMore ? 'Se încarcă...' : 'Încarcă mai multe servicii'}
                  </Button>
                </motion.div>
              )}

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
    </div>
  );
};

export default EventsPage;