import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailIcon, LockIcon, UserIcon, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface RegisterFormInputs {
  nume: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: 'participant' | 'furnizor';
}

export const RegisterForm: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors }, setError } = useForm<RegisterFormInputs>({
    defaultValues: {
      rol: 'participant'
    },
    mode: 'onChange' // Validare în timp real
  });
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const { inregistrare } = useAuth();
  const navigate = useNavigate();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormInputs) => {
    try {
      setLoading(true);
      setRegisterError(null);

      // Additional client-side validation
      if (!data.nume.trim()) {
        setError('nume', { message: 'Numele complet este obligatoriu' });
        return;
      }

      if (!data.email.trim()) {
        setError('email', { message: 'Adresa de email este obligatorie' });
        return;
      }

      if (!data.password) {
        setError('password', { message: 'Parola este obligatorie' });
        return;
      }

      if (!data.confirmPassword) {
        setError('confirmPassword', { message: 'Confirmarea parolei este obligatorie' });
        return;
      }

      if (data.password !== data.confirmPassword) {
        setError('confirmPassword', { message: 'Parolele nu se potrivesc' });
        return;
      }

      await inregistrare(data.email.trim(), data.password, data.nume.trim(), data.rol);
      navigate('/');
    } catch (error: any) {
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setRegisterError('Această adresă de email este deja folosită de un alt cont.');
            break;
          case 'auth/invalid-email':
            setRegisterError('Adresa de email nu este validă.');
            break;
          case 'auth/weak-password':
            setRegisterError('Parola este prea slabă. Alegeți o parolă cu cel puțin 6 caractere.');
            break;
          case 'auth/network-request-failed':
            setRegisterError('Eroare de conexiune. Verificați conexiunea la internet și încercați din nou.');
            break;
          case 'auth/too-many-requests':
            setRegisterError('Prea multe încercări. Vă rugăm să încercați din nou mai târziu.');
            break;
          default:
            setRegisterError('A apărut o eroare la înregistrare. Vă rugăm să încercați din nou.');
        }
      } else {
        setRegisterError(error.message || 'A apărut o eroare la înregistrare. Vă rugăm să încercați din nou.');
      }
      console.error('Eroare la înregistrare:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center text-white mb-8">Înregistrare</h2>
      
      {registerError && (
        <div className="text-red-300 bg-red-900/30 px-4 py-2 rounded-lg mb-6 text-center flex items-center justify-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{registerError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Input
          id="nume"
          type="text"
          label="Nume complet"
          leftIcon={<UserIcon className="h-5 w-5" />}
          error={errors.nume?.message}
          fullWidth
          glassmorphism
          placeholder="Nume Prenume"
          {...register('nume', { 
            required: 'Numele complet este obligatoriu',
            minLength: {
              value: 2,
              message: 'Numele trebuie să conțină cel puțin 2 caractere'
            },
            maxLength: {
              value: 50,
              message: 'Numele nu poate depăși 50 de caractere'
            },
            pattern: {
              value: /^[a-zA-ZăâîșțĂÂÎȘȚ\s]+$/,
              message: 'Numele poate conține doar litere și spații'
            },
            validate: {
              notOnlySpaces: (value) => value.trim().length > 0 || 'Numele nu poate conține doar spații',
              validFormat: (value) => {
                const trimmed = value.trim();
                return trimmed.split(' ').length >= 2 || 'Vă rugăm să introduceți numele și prenumele';
              }
            }
          })}
        />
        
        <Input
          id="email"
          type="email"
          label="Email"
          leftIcon={<MailIcon className="h-5 w-5" />}
          error={errors.email?.message}
          fullWidth
          glassmorphism
          placeholder="nume@exemplu.ro"
          {...register('email', { 
            required: 'Adresa de email este obligatorie',
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: 'Vă rugăm să introduceți o adresă de email validă (ex: nume@exemplu.ro)'
            },
            validate: {
              noSpaces: (value) => !value.includes(' ') || 'Adresa de email nu poate conține spații',
              validDomain: (value) => {
                const domain = value.split('@')[1];
                return domain && domain.includes('.') || 'Domeniul email-ului nu este valid';
              },
              notTooLong: (value) => value.length <= 100 || 'Adresa de email este prea lungă'
            }
          })}
        />
        
        <Input
          id="password"
          type="password"
          label="Parolă"
          leftIcon={<LockIcon className="h-5 w-5" />}
          error={errors.password?.message}
          fullWidth
          glassmorphism
          placeholder="Minim 6 caractere"
          {...register('password', { 
            required: 'Parola este obligatorie',
            minLength: {
              value: 6,
              message: 'Parola trebuie să conțină cel puțin 6 caractere'
            },
            maxLength: {
              value: 128,
              message: 'Parola nu poate depăși 128 de caractere'
            },
            validate: {
              notEmpty: (value) => value.trim().length > 0 || 'Parola nu poate fi goală',
              noSpaces: (value) => !value.includes(' ') || 'Parola nu poate conține spații',
              hasLetters: (value) => /[a-zA-Z]/.test(value) || 'Parola trebuie să conțină cel puțin o literă',
              hasNumbers: (value) => /[0-9]/.test(value) || 'Parola trebuie să conțină cel puțin o cifră'
            }
          })}
        />
        
        <Input
          id="confirmPassword"
          type="password"
          label="Confirmă parola"
          leftIcon={<LockIcon className="h-5 w-5" />}
          error={errors.confirmPassword?.message}
          fullWidth
          glassmorphism
          placeholder="Reintroduceți parola"
          {...register('confirmPassword', { 
            required: 'Vă rugăm să confirmați parola',
            validate: {
              matchesPassword: (value) => value === password || 'Parolele nu se potrivesc',
              notEmpty: (value) => value.trim().length > 0 || 'Confirmarea parolei nu poate fi goală'
            }
          })}
        />
        
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">Tip de utilizator *</label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                id="participant"
                type="radio"
                value="participant"
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-white/20 bg-white/5"
                {...register('rol', { required: 'Vă rugăm să selectați tipul de utilizator' })}
              />
              <label htmlFor="participant" className="ml-3 block text-sm text-white/80">
                Participant - Vreau să găsesc servicii pentru evenimentul meu
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                id="furnizor"
                type="radio"
                value="furnizor"
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-white/20 bg-white/5"
                {...register('rol', { required: 'Vă rugăm să selectați tipul de utilizator' })}
              />
              <label htmlFor="furnizor" className="ml-3 block text-sm text-white/80">
                Furnizor - Vreau să ofer servicii pentru evenimente
              </label>
            </div>
          </div>
          {errors.rol && (
            <p className="mt-1 text-sm text-red-300">{errors.rol.message}</p>
          )}
        </div>
        
        <Button
          type="submit"
          variant="white"
          fullWidth
          isLoading={loading}
        >
          Înregistrare
        </Button>
        
        <div className="text-center text-white/80">
          <span>Ai deja cont? </span>
          <a href="/conectare" className="text-white hover:text-amber-200 font-medium underline">
            Conectează-te
          </a>
        </div>
      </form>
    </div>
  );
};