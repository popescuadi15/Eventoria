import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CategoriesPage from './pages/CategoriesPage';
import CategoryPage from './pages/CategoryPage';
import TagEventsPage from './pages/TagEventsPage';
import EventPage from './pages/EventPage';
import EventsPage from './pages/EventsPage';
import ProfilePage from './pages/ProfilePage';
import AddServicePage from './pages/AddServicePage';
import AdminDashboard from './pages/AdminDashboard';
import { AdminRoute } from './components/auth/AdminRoute';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/conectare" element={<LoginPage />} />
                <Route path="/inregistrare" element={<RegisterPage />} />
                <Route path="/categorii" element={<CategoriesPage />} />
                <Route path="/categorii/:categoryId" element={<CategoryPage />} />
                <Route path="/evenimente" element={<EventsPage />} />
                <Route path="/evenimente/:tagId" element={<TagEventsPage />} />
                <Route path="/eveniment/:eventId" element={<EventPage />} />
                <Route path="/profil" element={<ProfilePage />} />
                <Route path="/adauga-serviciu" element={<AddServicePage />} />
                <Route 
                  path="/admin/*" 
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  } 
                />
                {/* Catch all route for invalid paths */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </FavoritesProvider>
    </AuthProvider>
  );
};

export default App;