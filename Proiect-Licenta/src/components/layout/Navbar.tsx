import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, ChevronDown, Heart, PlusCircle, MessageSquare, Package, Settings, Bell, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import type { FirestoreCategory } from '../../types';

export const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<(FirestoreCategory & { id: string })[]>([]);
  const { currentUser, userData, deconectare, unreadNotifications, pendingRequestsCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleLogout = async () => {
    try {
      await deconectare();
      navigate('/');
    } catch (error) {
      console.error('Eroare la deconectare:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Reset categories when closing menu
    if (isMenuOpen) {
      setIsMobileCategoriesOpen(false);
    }
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname === '/') {
      const section = document.querySelector(`#${sectionId}`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/?section=${sectionId}`);
    }
  };

  const isVendor = userData?.rol === 'furnizor';
  const isAdmin = userData?.rol === 'admin';

  // Calculate total notifications for admin
  const totalNotifications = isAdmin ? unreadNotifications + pendingRequestsCount : unreadNotifications;

  return (
    <nav className="bg-white shadow-md w-full sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link to="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-amber-600">Eventoria</span>
          </Link>
          
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <div className="flex items-center space-x-8">
              <Link to="/evenimente" className="text-sm font-medium text-gray-700 hover:text-amber-600">
                Servicii
              </Link>
              
              <div className="relative">
                <button
                  onMouseEnter={() => setIsCategoriesOpen(true)}
                  onMouseLeave={() => setIsCategoriesOpen(false)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-amber-600"
                >
                  <span>Categorii</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                
                <AnimatePresence>
                  {isCategoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onMouseEnter={() => setIsCategoriesOpen(true)}
                      onMouseLeave={() => setIsCategoriesOpen(false)}
                      className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div className="py-1">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/categorii/${category.id}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button
                onClick={() => scrollToSection('cum-functioneaza')}
                className="text-sm font-medium text-gray-700 hover:text-amber-600"
              >
                Despre
              </button>
              
              <button
                onClick={() => scrollToSection('footer')}
                className="text-sm font-medium text-gray-700 hover:text-amber-600"
              >
                Contact
              </button>

              {isVendor && (
                <Link 
                  to="/adauga-serviciu"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Adaugă servicii
                </Link>
              )}
            </div>
          </div>

          <div className="hidden sm:flex items-center">
            {currentUser ? (
              <div className="relative">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                    onClick={toggleProfileMenu}
                  >
                    <span className="mr-2 text-gray-700">{userData?.nume || 'Utilizator'}</span>
                    {totalNotifications > 0 && (
                      <span className="relative mr-2">
                        <Bell className="w-5 h-5 text-gray-600" />
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                          {totalNotifications > 99 ? '99+' : totalNotifications}
                        </span>
                      </span>
                    )}
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </div>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      {isAdmin && (
                        <>
                          <Link 
                            to="/admin"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Panou Administrare
                            {pendingRequestsCount > 0 && (
                              <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                                {pendingRequestsCount}
                              </span>
                            )}
                          </Link>
                          <div className="border-t border-gray-100"></div>
                        </>
                      )}

                      <Link 
                        to="/profil" 
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </Link>

                      <Link 
                        to="/profil"
                        state={{ activeTab: 'notifications' }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Bell className="mr-2 h-4 w-4" />
                        Notificări
                        {unreadNotifications > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">
                            {unreadNotifications}
                          </span>
                        )}
                      </Link>

                      <Link 
                        to="/profil"
                        state={{ activeTab: 'favorites' }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Heart className="mr-2 h-4 w-4" />
                        Evenimente Favorite
                      </Link>

                      <Link 
                        to="/profil"
                        state={{ activeTab: 'requests' }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <MessageSquare className="mr-2 h-4 w-4" />
                        {isVendor ? 'Cereri Primite' : 'Cereri Trimise'}
                      </Link>

                      <Link 
                        to="/profil"
                        state={{ activeTab: 'confirmed' }}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {isVendor ? 'Evenimente Confirmate' : 'Furnizorii Mei'}
                      </Link>
                      
                      {isVendor && (
                        <Link 
                          to="/profil"
                          state={{ activeTab: 'services' }}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Serviciile Mele
                        </Link>
                      )}
                      
                      <div className="border-t border-gray-100"></div>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Deconectare
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/conectare')}
                >
                  Conectare
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => navigate('/inregistrare')}
                >
                  Înregistrare
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-amber-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
              onClick={toggleMenu}
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-t border-gray-200"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/evenimente"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Servicii
              </Link>
              
              {/* Mobile Categories Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsMobileCategoriesOpen(!isMobileCategoriesOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-600"
                >
                  <span>Categorii</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isMobileCategoriesOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isMobileCategoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-6 space-y-1 max-h-48 overflow-y-auto">
                        {categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/categorii/${category.id}`}
                            className="block py-2 pl-3 pr-4 text-sm text-gray-600 hover:bg-gray-50 hover:text-amber-600 rounded-md"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsMobileCategoriesOpen(false);
                            }}
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button
                onClick={() => {
                  scrollToSection('cum-functioneaza');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-600"
              >
                Despre
              </button>
              
              <button
                onClick={() => {
                  scrollToSection('footer');
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-600"
              >
                Contact
              </button>

              {isVendor && (
                <Link
                  to="/adauga-serviciu"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-amber-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Adaugă servicii
                  </div>
                </Link>
              )}
            </div>
            
            {/* User Profile Section - Fixed at bottom */}
            <div className="pt-4 pb-3 border-t border-gray-200">
              {currentUser ? (
                <>
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center text-white">
                        {userData?.nume?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{userData?.nume || 'Utilizator'}</div>
                      <div className="text-sm font-medium text-gray-500">{userData?.email}</div>
                      {isAdmin && (
                        <div className="text-xs text-red-600 font-medium">Administrator</div>
                      )}
                    </div>
                    {totalNotifications > 0 && (
                      <div className="ml-auto">
                        <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                          {totalNotifications > 99 ? '99+' : totalNotifications}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 space-y-1">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center justify-between px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>Panou Administrare</span>
                        {pendingRequestsCount > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {pendingRequestsCount}
                          </span>
                        )}
                      </Link>
                    )}

                    <Link
                      to="/profil"
                      className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profil
                    </Link>

                    <Link
                      to="/profil"
                      state={{ activeTab: 'notifications' }}
                      className="flex items-center justify-between px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>Notificări</span>
                      {unreadNotifications > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">
                          {unreadNotifications}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/profil"
                      state={{ activeTab: 'favorites' }}
                      className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Evenimente Favorite
                    </Link>

                    <Link
                      to="/profil"
                      state={{ activeTab: 'requests' }}
                      className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {isVendor ? 'Cereri Primite' : 'Cereri Trimise'}
                    </Link>

                    <Link
                      to="/profil"
                      state={{ activeTab: 'confirmed' }}
                      className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {isVendor ? 'Evenimente Confirmate' : 'Furnizorii Mei'}
                    </Link>

                    {isVendor && (
                      <Link
                        to="/profil"
                        state={{ activeTab: 'services' }}
                        className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Serviciile Mele
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Deconectare
                    </button>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1 px-4">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      navigate('/conectare');
                      setIsMenuOpen(false);
                    }}
                    className="mb-2"
                  >
                    Conectare
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      navigate('/inregistrare');
                      setIsMenuOpen(false);
                    }}
                  >
                    Înregistrare
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};