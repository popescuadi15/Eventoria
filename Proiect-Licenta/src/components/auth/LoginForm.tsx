import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailIcon, LockIcon, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface LoginFormInputs {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors }, setError } = useForm<LoginFormInputs>({
    mode: 'onChange' // Validare în timp real
  });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const { conectare } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      setLoading(true);
      setLoginError(null);
      
      // Trim whitespace from email to prevent accidental spaces
      const email = data.email.trim();
      
      // Additional client-side validation
      if (!email) {
        setError('email', { message: 'Adresa de email este obligatorie' });
        return;
      }

      if (!data.password) {
        setError('password', { message: 'Parola este obligatorie' });
        return;
      }

      // Email format validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        setError('email', { message: 'Vă rugăm să introduceți o adresă de email validă (ex: nume@exemplu.ro)' });
        return;
      }

      // Password length validation
      if (data.password.length < 6) {
        setError('password', { message: 'Parola trebuie să conțină cel puțin 6 caractere' });
        return;
      }

      await conectare(email, data.password);
      navigate('/');
    } catch (error: any) {
      // Handle specific Firebase auth error codes
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            setLoginError('Nu există niciun cont cu această adresă de email.');
            break;
          case 'auth/wrong-password':
            setLoginError('Parola introdusă este incorectă.');
            break;
          case 'auth/invalid-credential':
            setLoginError('Email-ul sau parola introdusă sunt incorecte. Vă rugăm să verificați datele și să încercați din nou.');
            break;
          case 'auth/invalid-email':
            setLoginError('Adresa de email nu este validă.');
            break;
          case 'auth/user-disabled':
            setLoginError('Acest cont a fost dezactivat. Contactați administratorul.');
            break;
          case 'auth/too-many-requests':
            setLoginError('Prea multe încercări eșuate. Contul a fost temporar blocat. Încercați din nou mai târziu.');
            break;
          case 'auth/network-request-failed':
            setLoginError('Eroare de conexiune. Verificați conexiunea la internet și încercați din nou.');
            break;
          default:
            setLoginError('A apărut o eroare la conectare. Vă rugăm să încercați din nou.');
        }
      } else {
        // Handle client-side validation errors
        setLoginError(error.message);
      }
      console.error('Eroare la conectare:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-center text-white mb-8">Conectare</h2>
      
      {loginError && (
        <div className="text-red-300 bg-red-900/30 px-4 py-2 rounded-lg mb-6 text-center flex items-center justify-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>{loginError}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
              notEmpty: (value) => value.trim().length > 0 || 'Adresa de email nu poate fi goală'
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
          placeholder="Introduceți parola"
          {...register('password', { 
            required: 'Parola este obligatorie',
            minLength: {
              value: 6,
              message: 'Parola trebuie să conțină cel puțin 6 caractere'
            },
            validate: {
              notEmpty: (value) => value.trim().length > 0 || 'Parola nu poate fi goală',
              noSpaces: (value) => !value.includes(' ') || 'Parola nu poate conține spații'
            }
          })}
        />
        
        <div className="text-right">
          <a href="/reset-parola" className="text-white/80 hover:text-white text-sm font-medium">
            Ai uitat parola?
          </a>
        </div>
        
        <Button
          type="submit"
          variant="white"
          fullWidth
          isLoading={loading}
        >
          Conectare
        </Button>
        
        <div className="text-center text-white/80">
          <span>Nu ai cont? </span>
          <a href="/inregistrare" className="text-white hover:text-amber-200 font-medium underline">
            Înregistrează-te
          </a>
        </div>
      </form>
    </div>
  );
};