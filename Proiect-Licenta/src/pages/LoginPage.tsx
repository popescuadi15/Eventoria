import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-amber-600 to-amber-800 relative">
      {/* Back arrow */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-white hover:text-amber-200 z-20 transition-colors"
      >
        <ArrowLeft className="w-8 h-8" />
      </Link>

      {/* Background overlay */}
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg')] bg-cover bg-center opacity-80" />

      {/* Glassmorphism container */}
      <div className="z-10 w-full max-w-md px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
          <h1 className="text-center text-3xl font-bold text-white mb-8">Eventoria</h1>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;