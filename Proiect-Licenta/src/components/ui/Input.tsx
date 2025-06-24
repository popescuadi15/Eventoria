import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  glassmorphism?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    helperText, 
    error, 
    fullWidth = false, 
    glassmorphism = false,
    className, 
    ...props 
  }, ref) => {
    return (
      <div className={clsx('relative', { 'w-full': fullWidth })}>
        <div className="relative">
          <input
            ref={ref}
            placeholder=" "
            className={clsx(
              'peer w-full rounded-lg transition-all',
              'focus:outline-none focus:ring-1',
              {
                'w-full': fullWidth,
                // Glassmorphism styles
                'bg-white/5 text-white placeholder-transparent border-transparent focus:ring-white/60': glassmorphism,
                // Regular styles
                'border-2 border-gray-300 text-gray-900 focus:border-amber-500 focus:ring-amber-500/20': !glassmorphism && !error,
                'border-2 border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500/20': !glassmorphism && error,
              },
              'px-4 py-3',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={props.id ? `${props.id}-description` : undefined}
            {...props}
          />

          {label && (
            <label 
              htmlFor={props.id} 
              className={clsx(
                "absolute left-4 transition-all",
                glassmorphism ? (
                  "text-white/80 text-sm px-1 bg-transparent -top-2.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/60 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-white"
                ) : (
                  "text-sm px-1 bg-white -top-2.5",
                  error ? 'text-red-600' : 'text-gray-600'
                )
              )}
            >
              {label}
            </label>
          )}
        </div>
        
        {(error || helperText) && (
          <p
            className={clsx('text-sm mt-1', {
              'text-red-300': error && glassmorphism,
              'text-red-600': error && !glassmorphism,
              'text-white/80': !error && helperText && glassmorphism,
              'text-gray-500': !error && helperText && !glassmorphism,
            })}
            id={props.id ? `${props.id}-description` : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';