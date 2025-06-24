import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MapPin, Calendar, Clock, Star, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FirestoreCategory } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FavoriteButton } from '../components/events/FavoriteButton';

interface Event {
  id: string;
  name: string;
  description: string;
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
  createdAt: Date;
  furnizor: string;
  numarTelefon: string;
  email: string;
  rating?: number;
  status?: string;
}

const AVAILABLE_CITIES = [
  'Toate orașele',
  'București',
  'Cluj-Napoca',
  'Timișoara',
  'Iași',
  'Brașov',
  'Constanța',
  'Craiova',
  'Galați',
  'Ploiești',
  'Oradea'
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

const EVENTS_PER_PAGE = 6;

const CategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<FirestoreCategory | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Toate orașele');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [ratingFilter, setRatingFilter] = useState(0);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const fetchCategoryAndEvents = async () => {
      try {
        if (!categoryId) return;

        const categoryDoc = await getDoc(doc(db, 'categories', categoryId));
        if (!categoryDoc.exists()) {
          setError('Categoria nu a fost găsită');
          return;
        }

        const categoryData = categoryDoc.data() as FirestoreCategory;
        setCategory(categoryData);

        setEvents([]);
        setLastDoc(null);
        setHasMore(true);

        await fetchEvents();
      } catch (err) {
        console.error('Eroare la încărcarea datelor:', err);
        setError('A apărut o eroare la încărcarea datelor. Vă rugăm încercați din nou mai târziu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndEvents();
  }, [categoryId]);

  useEffect(() => {
    if (!category || selectedSubcategory !== 'all') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const subcategory = entry.target.getAttribute('data-subcategory');
            if (subcategory) {
              setSelectedSubcategory(subcategory);
            }
          }
        });
      },
      {
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0.5
      }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) {
        observerRef.current?.observe(ref);
      }
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [category, selectedSubcategory]);

  const fetchEvents = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      }

      let eventsQuery = query(
        collection(db, 'events'),
        where('categoryRef', '==', doc(db, 'categories', categoryId!))
      );

      if (selectedSubcategory !== 'all') {
        eventsQuery = query(
          eventsQuery,
          where('subcategories', 'array-contains', selectedSubcategory)
        );
      }

      eventsQuery = query(
        eventsQuery,
        orderBy('createdAt', 'desc'),
        limit(EVENTS_PER_PAGE)
      );

      if (loadMore && lastDoc) {
        eventsQuery = query(
          eventsQuery,
          startAfter(lastDoc)
        );
      }

      const snapshot = await getDocs(eventsQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
        if (!loadMore) setEvents([]);
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

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      
      if (loadMore) {
        setEvents(prev => [...prev, ...activeEvents]);
      } else {
        setEvents(activeEvents);
      }

      setHasMore(snapshot.docs.length === EVENTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('A apărut o eroare la încărcarea evenimentelor');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setEvents([]);
    setLastDoc(null);
    setHasMore(true);
    fetchEvents();
  }, [selectedSubcategory]);

  const handleLoadMore = async () => {
    if (!loadingMore && hasMore) {
      await fetchEvents(true);
    }
  };

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

    const matchesPrice = event.price.amount >= priceRange.min && 
      event.price.amount <= priceRange.max;

    const matchesRating = !ratingFilter || (event.rating || 0) >= ratingFilter;

    return matchesSearch && matchesCity && matchesPrice && matchesRating;
  }));

  const groupedEvents = selectedSubcategory === 'all' && category?.subcategories
    ? category.subcategories.reduce((acc, subcat) => {
        acc[subcat] = filteredEvents.filter(event => 
          event.subcategories?.includes(subcat)
        );
        return acc;
      }, {} as Record<string, Event[]>)
    : { [selectedSubcategory]: filteredEvents };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('Toate orașele');
    setPriceRange({ min: 0, max: 10000 });
    setRatingFilter(0);
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="flex gap-8">
              <div className="w-64 h-96 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-6">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-48 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto text-center text-red-600">
          <p>{error || 'Categoria nu a fost găsită'}</p>
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
      <div 
        className="relative h-48 sm:h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${category.imageUrl})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-2xl sm:text-4xl font-bold mb-2">{category.name}</h1>
            <p className="text-base sm:text-lg">{category.description}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters - Non-sticky on mobile */}
      <div className="bg-white shadow-md relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Caută furnizori sau servicii..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
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
                  className="w-full pl-10 pr-8 py-3 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white"
                >
                  {AVAILABLE_CITIES.map((city) => (
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
                  className="w-full pl-10 pr-8 py-3 text-base border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 appearance-none bg-white"
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
                <span className="hidden sm:inline">Filtrează</span>
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

              <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
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
                        <Star className="w-4 h-4 fill-current" />
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
          {/* Subcategories Sidebar - Hidden on mobile when filters are open */}
          <div className={`lg:w-64 flex-shrink-0 ${showFilters ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-lg shadow-lg p-6 lg:sticky lg:top-8">
              <h2 className="text-lg font-semibold mb-4">Subcategorii</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedSubcategory('all')}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    selectedSubcategory === 'all'
                      ? 'bg-amber-100 text-amber-900' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Toate
                </button>
                {category.subcategories?.map((subcategory) => (
                  <button
                    key={subcategory}
                    onClick={() => {
                      setSelectedSubcategory(subcategory);
                      if (selectedSubcategory === 'all') {
                        const section = sectionRefs.current[subcategory];
                        if (section) {
                          section.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      selectedSubcategory === subcategory 
                        ? 'bg-amber-100 text-amber-900' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {subcategory}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Events Content */}
          <div className="flex-1">
            <div className="space-y-16">
              {Object.entries(groupedEvents).map(([subcategory, subcatEvents]) => (
                Array.isArray(subcatEvents) && subcatEvents.length > 0 && (
                  <div
                    key={subcategory}
                    ref={el => sectionRefs.current[subcategory] = el}
                    data-subcategory={subcategory}
                  >
                    <h2 className="text-2xl font-semibold mb-6">{subcategory}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {subcatEvents.map((event) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                            <div className="relative h-32 overflow-hidden rounded-t-lg">
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
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex flex-wrap gap-1">
                                  {event.subcategories?.map((subcategory, index) => (
                                    <span key={index} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
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
                              <h3 className="text-lg font-semibold mb-2 line-clamp-1">{event.name}</h3>
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
                  </div>
                )
              ))}

              {hasMore && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Se încarcă...</span>
                      </div>
                    ) : (
                      'Încarcă mai multe'
                    )}
                  </button>
                </div>
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

export default CategoryPage;