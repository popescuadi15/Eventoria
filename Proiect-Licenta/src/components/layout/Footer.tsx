import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="footer" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-amber-500">Eventoria</h3>
            <p className="text-gray-300 text-sm">
              Platformă românească de organizare și descoperire a evenimentelor care conectează furnizori de servicii cu clienți pentru crearea de evenimente memorabile.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Instagram size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Link-uri Rapide</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-amber-500">Acasă</Link>
              </li>
              <li>
                <Link to="/evenimente" className="text-gray-300 hover:text-amber-500">Evenimente</Link>
              </li>
              <li>
                <Link to="/categorii" className="text-gray-300 hover:text-amber-500">Categorii</Link>
              </li>
              <li>
                <Link to="/despre" className="text-gray-300 hover:text-amber-500">Despre Noi</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-amber-500">Contact</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Categorii</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/categorii/locatie" className="text-gray-300 hover:text-amber-500">Locație Eveniment</Link>
              </li>
              <li>
                <Link to="/categorii/fotografie" className="text-gray-300 hover:text-amber-500">Fotografie și Video</Link>
              </li>
              <li>
                <Link to="/categorii/muzica" className="text-gray-300 hover:text-amber-500">Muzică și Entertainment</Link>
              </li>
              <li>
                <Link to="/categorii/catering" className="text-gray-300 hover:text-amber-500">Catering</Link>
              </li>
              <li>
                <Link to="/categorii/decor" className="text-gray-300 hover:text-amber-500">Decor și Aranjamente</Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <MapPin size={18} className="mr-2 text-amber-500" />
                <span className="text-gray-300">Str. Victoriei 25, București</span>
              </li>
              <li className="flex items-center">
                <Phone size={18} className="mr-2 text-amber-500" />
                <span className="text-gray-300">+40 721 234 567</span>
              </li>
              <li className="flex items-center">
                <Mail size={18} className="mr-2 text-amber-500" />
                <span className="text-gray-300">contact@eventoria.ro</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Eventoria. Toate drepturile rezervate.</p>
        </div>
      </div>
    </footer>
  );
};