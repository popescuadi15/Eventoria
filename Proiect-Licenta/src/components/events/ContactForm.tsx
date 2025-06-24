import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Toast } from '../ui/Toast';
import { AlertCircle } from 'lucide-react';

interface ContactFormProps {
  eventId: string;
  eventName: string;
  vendorId: string;
  onClose: () => void;
}

// Opțiuni pentru selectorul de timp (ore și minute la 15 minute)
const TIME_OPTIONS = [
  '00:00', '00:15', '00:30', '00:45',
  '01:00', '01:15', '01:30', '01:45',
  '02:00', '02:15', '02:30', '02:45',
  '03:00', '03:15', '03:30', '03:45',
  '04:00', '04:15', '04:30', '04:45',
  '05:00', '05:15', '05:30', '05:45',
  '06:00', '06:15', '06:30', '06:45',
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00', '20:15', '20:30', '20:45',
  '21:00', '21:15', '21:30', '21:45',
  '22:00', '22:15', '22:30', '22:45',
  '23:00', '23:15', '23:30', '23:45'
];

// Lista orașelor din România pentru validare (fără diacritice)
const ROMANIAN_CITIES = [
  'bucuresti', 'cluj-napoca', 'timisoara', 'iasi', 'constanta', 'craiova', 'brasov', 
  'galati', 'ploiesti', 'oradea', 'bacau', 'pitesti', 'arad', 'sibiu', 'targu mures',
  'baia mare', 'buzau', 'botosani', 'satu mare', 'ramnicu valcea', 'drobeta-turnu severin',
  'suceava', 'piatra neamt', 'targu jiu', 'tulcea', 'focsani', 'bistrita', 'resita',
  'alba iulia', 'deva', 'hunedoara', 'slatina', 'calarasi', 'giurgiu', 'slobozia',
  'vaslui', 'roman', 'turda', 'medias', 'onesti', 'campina', 'dej', 'lugoj', 'medgidia'
];

// Funcție pentru eliminarea diacriticelor
const removeDiacritics = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/ş/g, 's')
    .replace(/ţ/g, 't');
};

// Funcție pentru formatarea textului (prima literă mare)
const capitalizeText = (str: string): string => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const ContactForm: React.FC<ContactFormProps> = ({
  eventId,
  eventName,
  vendorId,
  onClose
}) => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    phone: '',
    location: '',
    startDate: '',
    startTime: '10:00',
    endDate: '',
    endTime: '18:00',
    message: ''
  });

  const validateLocation = (location: string): string | null => {
    const trimmedLocation = location.trim();
    
    // Verifică dacă locația este goală
    if (!trimmedLocation) {
      return 'Locația evenimentului este obligatorie';
    }

    // Verifică lungimea minimă
    if (trimmedLocation.length < 3) {
      return 'Locația trebuie să conțină cel puțin 3 caractere';
    }

    // Verifică lungimea maximă
    if (trimmedLocation.length > 200) {
      return 'Locația nu poate depăși 200 de caractere';
    }

    // Verifică dacă conține doar caractere valide (litere, cifre, spații, virgule, puncte, liniuțe)
    if (!/^[a-zA-ZăâîșțĂÂÎȘȚşţ0-9\s,.\-]+$/.test(trimmedLocation)) {
      return 'Locația poate conține doar litere, cifre, spații și semne de punctuație';
    }

    // Verifică dacă conține cel puțin un oraș din România (fără diacritice)
    const normalizedLocation = removeDiacritics(trimmedLocation);
    const hasRomanianCity = ROMANIAN_CITIES.some(city => 
      normalizedLocation.includes(city)
    );

    if (!hasRomanianCity) {
      return 'Locația trebuie să conțină un oraș din România (ex: București, Cluj-Napoca, Timișoara)';
    }

    // Verifică dacă nu conține doar spații și semne de punctuație
    if (!/[a-zA-ZăâîșțĂÂÎȘȚşţ0-9]/.test(trimmedLocation)) {
      return 'Locația trebuie să conțină cel puțin o literă sau cifră';
    }

    return null; // Validare reușită
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Validare telefon
    if (!formData.phone.trim()) {
      errors.phone = 'Numărul de telefon este obligatoriu';
    } else {
      const cleanPhone = formData.phone.replace(/\s/g, '');
      if (!/^(\+4|0)[0-9]{9}$/.test(cleanPhone)) {
        errors.phone = 'Numărul de telefon nu este valid (ex: 0721234567 sau +40721234567)';
      }
    }

    // Validare locație îmbunătățită
    const locationError = validateLocation(formData.location);
    if (locationError) {
      errors.location = locationError;
    }

    // Validare dată început
    if (!formData.startDate) {
      errors.startDate = 'Data de început este obligatorie';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        errors.startDate = 'Data de început nu poate fi în trecut';
      }
    }

    // Validare oră început
    if (!formData.startTime) {
      errors.startTime = 'Ora de început este obligatorie';
    }

    // Validare dată sfârșit
    if (!formData.endDate) {
      errors.endDate = 'Data de sfârșit este obligatorie';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = 'Data de sfârșit nu poate fi înainte de data de început';
    }

    // Validare oră sfârșit
    if (!formData.endTime) {
      errors.endTime = 'Ora de sfârșit este obligatorie';
    } else if (formData.startDate === formData.endDate && formData.startTime && formData.endTime <= formData.startTime) {
      errors.endTime = 'Ora de sfârșit trebuie să fie după ora de început';
    }

    // Validare mesaj
    if (!formData.message.trim()) {
      errors.message = 'Mesajul este obligatoriu';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Mesajul trebuie să conțină cel puțin 10 caractere';
    } else if (formData.message.trim().length > 1000) {
      errors.message = 'Mesajul nu poate depăși 1000 de caractere';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !userData) {
      setError('Trebuie să fiți autentificat pentru a trimite o cerere');
      return;
    }

    // Validare formular
    const errors = validateForm();
    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      setError('Vă rugăm să corectați erorile din formular');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestData = {
        eventId,
        eventName,
        userId: currentUser.uid,
        userName: userData?.nume || '',
        userEmail: userData?.email || '',
        userPhone: formData.phone.trim(),
        message: formData.message.trim(),
        location: formData.location.trim(),
        startDate: new Date(`${formData.startDate}T${formData.startTime}`),
        endDate: new Date(`${formData.endDate}T${formData.endTime}`),
        status: 'pending',
        createdAt: serverTimestamp(),
        vendorId
      };

      await addDoc(collection(db, 'requests'), requestData);
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (error) {
      console.error('Error sending request:', error);
      setError('A apărut o eroare la trimiterea cererii. Vă rugăm să încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // Formatare specială pentru câmpul locație
    if (name === 'location') {
      // Formatează textul: prima literă mare pentru fiecare cuvânt
      processedValue = capitalizeText(value);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Validare în timp real și ștergere erori
    if (name === 'location') {
      const locationError = validateLocation(processedValue);
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (locationError) {
          newErrors.location = locationError;
        } else {
          // Șterge eroarea dacă validarea este reușită
          delete newErrors.location;
        }
        return newErrors;
      });
    } else {
      // Pentru alte câmpuri, șterge eroarea când utilizatorul începe să scrie
      if (validationErrors[name]) {
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }

    // Șterge eroarea generală când utilizatorul modifică orice câmp
    if (error) {
      setError(null);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Contactează furnizorul</h2>
      
      {error && (
        <div className="mb-6 text-red-700 bg-red-100 px-4 py-2 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nume complet
            </label>
            <input
              type="text"
              value={userData?.nume || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresa de email
            </label>
            <input
              type="email"
              value={userData?.email || ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Număr de telefon *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
                validationErrors.phone ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0721234567 sau +40721234567"
            />
            {validationErrors.phone && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locația evenimentului *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
                validationErrors.location ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="ex: București, Sala Palatului sau Cluj-Napoca, Hotel Continental"
            />
            {validationErrors.location && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Includeți orașul și locația specifică (ex: București, Sala Palatului)
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de început *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
                validationErrors.startDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.startDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.startDate}</p>
            )}
            
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
              Ora de început *
            </label>
            <select
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
                validationErrors.startTime ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {validationErrors.startTime && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.startTime}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de sfârșit *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
                validationErrors.endDate ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.endDate && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.endDate}</p>
            )}
            
            <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
              Ora de sfârșit *
            </label>
            <select
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
                validationErrors.endTime ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              {TIME_OPTIONS.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {validationErrors.endTime && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.endTime}</p>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mesaj pentru furnizor *
          </label>
          <textarea
            name="message"
            rows={4}
            className={`w-full px-4 py-2 border rounded-md focus:ring-amber-500 focus:border-amber-500 ${
              validationErrors.message ? 'border-red-300' : 'border-gray-300'
            }`}
            value={formData.message}
            onChange={handleChange}
            placeholder="Descrieți detaliile evenimentului, cerințele speciale, bugetul aproximativ..."
          />
          {validationErrors.message && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.message.length}/1000 caractere
          </p>
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Anulează
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            Trimite cererea
          </Button>
        </div>
      </form>

      {success && (
        <Toast
          message="Cererea a fost trimisă cu succes! Furnizorul va fi notificat."
          type="success"
          onClose={() => setSuccess(false)}
        />
      )}
    </div>
  );
};