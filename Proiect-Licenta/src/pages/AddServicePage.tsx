import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, setDoc, getDocs, getDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, PlusCircle, ChevronDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { MultiSelect } from '../components/ui/MultiSelect';
import { ImageUpload } from '../components/ui/ImageUpload';
import { Toast } from '../components/ui/Toast';
import type { FirestoreCategory } from '../types';

interface ServiceFormData {
  name: string;
  description: string;
  categoryId: string;
  subcategories: string[];
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  locations: string[];
  date: string;
  imageUrl: string;
  numarTelefon: string;
  email: string;
  tags: string[];
}

const CITIES = [
  'București',
  'Cluj-Napoca',
  'Timișoara',
  'Iași',
  'Constanța',
  'Craiova',
  'Brașov',
  'Galați',
  'Ploiești',
  'Oradea'
];

const EVENT_TAGS = [
  'nunta',
  'botez',
  'cununie',
  'eveniment-privat',
  'eveniment-sportiv',
  'festival',
  'inaugurare',
  'petrecere-copii',
  'petrecere-corporativa',
  'revelion',
  'zilele-orasului'
];

const PRICE_TYPES = [
  { value: 'per_hour', label: 'Per oră' },
  { value: 'per_event', label: 'Per eveniment' },
  { value: 'per_person', label: 'Per persoană' }
];

const SUBCATEGORIES = [
  'Săli de nuntă',
  'Spații corporative',
  'Grădini și terase',
  'Săli de conferințe',
  'Spații tematice',
  'Spații exterioare'
];

const AddServicePage: React.FC = () => {
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [categories, setCategories] = useState<(FirestoreCategory & { id: string })[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    description: '',
    categoryId: '',
    subcategories: [],
    price: {
      amount: 0,
      type: 'per_event'
    },
    locations: [],
    date: '',
    imageUrl: '',
    numarTelefon: '',
    email: '',
    tags: []
  });

  const selectedCategory = categories.find(cat => cat.id === formData.categoryId);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = '2.4rem';
    const newHeight = Math.min(textarea.scrollHeight, 120);
    textarea.style.height = `${newHeight}px`;
    
    setFormData(prev => ({ ...prev, description: e.target.value }));
    
    // Șterge eroarea când utilizatorul începe să scrie
    if (validationErrors.description) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.description;
        return newErrors;
      });
    }
  };

  useEffect(() => {
    if (!currentUser || userData?.rol !== 'furnizor') {
      navigate('/');
      return;
    }

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
        setError('Eroare la încărcarea categoriilor');
      }
    };

    fetchCategories();
  }, [currentUser, userData, navigate]);

  const validateForm = (data: ServiceFormData) => {
    const errors: Record<string, string> = {};

    // Validare nume serviciu
    if (!data.name.trim()) {
      errors.name = 'Numele serviciului este obligatoriu';
    } else if (data.name.trim().length < 3) {
      errors.name = 'Numele serviciului trebuie să conțină cel puțin 3 caractere';
    } else if (data.name.trim().length > 100) {
      errors.name = 'Numele serviciului nu poate depăși 100 de caractere';
    }

    // Validare descriere
    if (!data.description.trim()) {
      errors.description = 'Descrierea serviciului este obligatorie';
    } else if (data.description.trim().length < 20) {
      errors.description = 'Descrierea trebuie să conțină cel puțin 20 de caractere';
    } else if (data.description.trim().length > 2000) {
      errors.description = 'Descrierea nu poate depăși 2000 de caractere';
    }

    // Validare categorie
    if (!data.categoryId) {
      errors.categoryId = 'Selectarea unei categorii este obligatorie';
    }

    // Validare subcategorii
    if (selectedSubcategories.length === 0) {
      errors.subcategories = 'Trebuie să selectați cel puțin o subcategorie';
    }

    // Validare preț
    if (!data.price.amount || data.price.amount <= 0) {
      errors.price = 'Prețul trebuie să fie mai mare decât 0';
    } else if (data.price.amount > 1000000) {
      errors.price = 'Prețul nu poate depăși 1.000.000 RON';
    }

    // Validare locații
    if (selectedLocations.length === 0) {
      errors.locations = 'Trebuie să selectați cel puțin o locație';
    }

    // Validare dată
    if (!data.date) {
      errors.date = 'Data disponibilității este obligatorie';
    } else {
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = 'Data disponibilității nu poate fi în trecut';
      }
    }

    // Validare imagine
    if (!data.imageUrl) {
      errors.imageUrl = 'Imaginea serviciului este obligatorie';
    }

    // Validare telefon
    if (!data.numarTelefon.trim()) {
      errors.numarTelefon = 'Numărul de telefon este obligatoriu';
    } else if (!/^(\+4|0)[0-9]{9}$/.test(data.numarTelefon.replace(/\s/g, ''))) {
      errors.numarTelefon = 'Numărul de telefon nu este valid (ex: 0721234567 sau +40721234567)';
    }

    // Validare email
    if (!data.email.trim()) {
      errors.email = 'Adresa de email este obligatorie';
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(data.email)) {
      errors.email = 'Adresa de email nu este validă';
    }

    // Validare tag-uri
    if (selectedTags.length === 0) {
      errors.tags = 'Trebuie să selectați cel puțin un tag';
    }

    return errors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'price.amount') {
      setFormData(prev => ({
        ...prev,
        price: { ...prev.price, amount: Number(value) }
      }));
    } else if (name === 'price.type') {
      setFormData(prev => ({
        ...prev,
        price: { ...prev.price, type: value as 'per_hour' | 'per_event' | 'per_person' }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Șterge eroarea când utilizatorul începe să scrie
    if (validationErrors[name] || (name.startsWith('price.') && validationErrors.price)) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        if (name.startsWith('price.')) {
          delete newErrors.price;
        } else {
          delete newErrors[name];
        }
        return newErrors;
      });
    }

    // Șterge eroarea generală
    if (error) {
      setError(null);
    }
  };

  const notifyAdmins = async (serviceName: string) => {
    try {
      // Get all admin users
      const usersRef = collection(db, 'utilizatori');
      const snapshot = await getDocs(usersRef);
      
      const adminUsers = snapshot.docs.filter(doc => 
        doc.data().rol === 'admin'
      );

      // Add notification to each admin
      for (const adminDoc of adminUsers) {
        const adminRef = doc(db, 'utilizatori', adminDoc.id);
        const newNotification = {
          type: 'request_received',
          message: `Cerere nouă de aprobare pentru serviciul "${serviceName}"`,
          createdAt: new Date().toISOString(),
          read: false
        };

        await updateDoc(adminRef, {
          notifications: arrayUnion(newNotification)
        });
      }

      console.log(`Notified ${adminUsers.length} admins about new service request`);
    } catch (error) {
      console.error('Error notifying admins:', error);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setValidationErrors({});

      if (!currentUser || !userData) {
        setError('Trebuie să fiți autentificat pentru a adăuga un serviciu');
        return;
      }

      if (userData.rol !== 'furnizor') {
        setError('Doar furnizorii pot adăuga servicii');
        return;
      }

      // Actualizează formData cu valorile curente
      const currentFormData = {
        ...formData,
        subcategories: selectedSubcategories,
        locations: selectedLocations,
        tags: selectedTags
      };

      // Validare formular
      const errors = validateForm(currentFormData);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setError('Vă rugăm să corectați erorile din formular');
        return;
      }

      const categoryRef = doc(db, 'categories', currentFormData.categoryId);
      const categoryDoc = await getDoc(categoryRef);
      
      if (!categoryDoc.exists()) {
        setError('Categoria selectată nu există');
        return;
      }

      const approvalRequestRef = doc(collection(db, 'service_approval_requests'));
      await setDoc(approvalRequestRef, {
        vendorId: currentUser.uid,
        vendorName: userData.nume,
        vendorEmail: userData.email,
        vendorPhone: currentFormData.numarTelefon.trim(),
        service: {
          name: currentFormData.name.trim(),
          description: currentFormData.description.trim(),
          categoryId: currentFormData.categoryId,
          categoryRef: categoryRef,
          subcategories: selectedSubcategories,
          price: currentFormData.price,
          locations: selectedLocations,
          date: new Date(currentFormData.date),
          imageUrl: currentFormData.imageUrl,
          tags: selectedTags
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Notify all admins about the new service request
      await notifyAdmins(currentFormData.name.trim());

      setSuccessMessage('Solicitarea dumneavoastră a fost trimisă spre aprobare. Administratorii au fost notificați și veți fi contactat când cererea va fi procesată.');
      setTimeout(() => {
        navigate('/profil');
      }, 3000);
    } catch (error) {
      console.error('Error adding service:', error);
      setError('A apărut o eroare la adăugarea serviciului. Vă rugăm să încercați din nou.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, imageUrl: url }));
    if (validationErrors.imageUrl) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.imageUrl;
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-amber-600 to-amber-800 relative py-12">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-white hover:text-amber-200 z-20 transition-colors"
      >
        <ArrowLeft className="w-8 h-8" />
      </button>

      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2291462/pexels-photo-2291462.jpeg')] bg-cover bg-center opacity-80" />

      <div className="z-10 w-full max-w-6xl mx-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Adaugă un serviciu nou</h1>
            <p className="text-white/80">
              Completează detaliile serviciului tău pentru a-l face vizibil potențialilor clienți
            </p>
          </div>

          {error && (
            <div className="mb-6 text-red-300 bg-red-900/30 px-4 py-2 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <Toast
              message={successMessage}
              type="success"
              onClose={() => setSuccessMessage(null)}
            />
          )}

          <form onSubmit={onSubmit} className="space-y-8" noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Numele serviciului *
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                    placeholder="Introduceți numele serviciului"
                  />
                  {validationErrors.name && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Categorie *
                  </label>
                  <div className="relative">
                    <select
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60 appearance-none"
                    >
                      <option value="" className="text-gray-600">Selectează o categorie</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
                  </div>
                  {validationErrors.categoryId && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.categoryId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Subcategorii *
                  </label>
                  <MultiSelect
                    options={selectedCategory?.subcategories || SUBCATEGORIES}
                    value={selectedSubcategories}
                    onChange={(subcategories) => {
                      setSelectedSubcategories(subcategories);
                      if (validationErrors.subcategories) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.subcategories;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Selectează subcategoriile"
                    glassmorphism
                    className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                  />
                  {validationErrors.subcategories && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.subcategories}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Locații disponibile *
                  </label>
                  <MultiSelect
                    options={CITIES}
                    value={selectedLocations}
                    onChange={(locations) => {
                      setSelectedLocations(locations);
                      if (validationErrors.locations) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.locations;
                          return newErrors;
                        });
                      }
                    }}
                    glassmorphism
                  />
                  {validationErrors.locations && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.locations}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Data disponibilitate *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                  />
                  {validationErrors.date && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.date}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Preț (RON) *
                    </label>
                    <input
                      type="number"
                      name="price.amount"
                      min="1"
                      max="1000000"
                      value={formData.price.amount || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                      placeholder="0"
                    />
                    {validationErrors.price && (
                      <p className="mt-1 text-sm text-red-300">{validationErrors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      Tip preț *
                    </label>
                    <select
                      name="price.type"
                      value={formData.price.type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                    >
                      {PRICE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Descriere *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    rows={2}
                    onChange={handleTextareaChange}
                    className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60 resize-none overflow-hidden min-h-[2.4rem] max-h-[120px]"
                    placeholder="Descrieți serviciul dumneavoastră în detaliu..."
                  />
                  {validationErrors.description && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.description}</p>
                  )}
                </div>

                <div>
                  <ImageUpload
                    label="Imagine serviciu *"
                    onUpload={handleImageUpload}
                    error={validationErrors.imageUrl}
                    glassmorphism
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Număr de telefon *
                  </label>
                  <input 
                    placeholder="0721234567 sau +40721234567"
                    type="tel"
                    name="numarTelefon"
                    value={formData.numarTelefon}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                  />
                  {validationErrors.numarTelefon && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.numarTelefon}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Email contact *
                  </label>
                  <input 
                    placeholder="contact@exemplu.ro"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/70 text-gray-900 rounded-lg border-transparent focus:ring-1 focus:ring-white/60"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Tag-uri pentru evenimente *
                  </label>
                  <MultiSelect
                    options={EVENT_TAGS}
                    value={selectedTags}
                    onChange={(tags) => {
                      setSelectedTags(tags);
                      if (validationErrors.tags) {
                        setValidationErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.tags;
                          return newErrors;
                        });
                      }
                    }}
                    glassmorphism
                  />
                  {validationErrors.tags && (
                    <p className="mt-1 text-sm text-red-300">{validationErrors.tags}</p>
                  )}
                </div>
              </div>
            </div>

             <div className="flex justify-end space-x-4 mt-8">
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Anulează
              </Button>
              <Button
                type="submit"
                variant="white"
                isLoading={loading}
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Adaugă serviciu
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddServicePage;