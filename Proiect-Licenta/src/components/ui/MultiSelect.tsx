import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { clsx } from 'clsx';

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  error?: string;
  placeholder?: string;
  glassmorphism?: boolean;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  value,
  onChange,
  label,
  error,
  placeholder = 'Selectează opțiuni',
  glassmorphism = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newValue = value.includes(option)
      ? value.filter(v => v !== option)
      : [...value, option];
    onChange(newValue);
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== option));
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className={clsx(
          "block text-sm font-medium mb-2",
          glassmorphism ? "text-white/80" : "text-gray-700"
        )}>
          {label}
        </label>
      )}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'min-h-[46px] px-4 py-2 rounded-lg cursor-pointer transition-all',
          'flex items-center justify-between',
          className,
          glassmorphism ? (
            'bg-white/70 text-gray-900 border-transparent focus:ring-1 focus:ring-white/60'
          ) : (
            'bg-white border-2 border-gray-300 focus:ring-2 focus:ring-amber-500'
          ),
          error && !glassmorphism && 'border-red-300'
        )}
      >
        <div className="flex flex-wrap gap-1">
          {value.length === 0 && (
            <span className={clsx(
              "text-sm",
              glassmorphism ? "text-gray-600" : "text-gray-500"
            )}>{placeholder}</span>
          )}
          {value.map((option) => (
            <span
              key={option}
              className={clsx(
                "inline-flex items-center px-2 py-1 rounded-full text-sm",
                glassmorphism ? "bg-amber-500/20 text-amber-900" : "bg-amber-100 text-amber-800"
              )}
            >
              {option}
              <button
                onClick={(e) => removeOption(option, e)}
                className="ml-1 hover:text-amber-900"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <ChevronDown className={clsx(
          "w-4 h-4 transition-transform",
          isOpen && "transform rotate-180",
          glassmorphism ? "text-gray-600" : "text-gray-400"
        )} />
      </div>

      {error && (
        <p className={clsx(
          "mt-1 text-sm",
          glassmorphism ? "text-red-300" : "text-red-600"
        )}>{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg max-h-60 overflow-auto">
          {options.map((option) => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              className={clsx(
                "px-4 py-2 cursor-pointer flex items-center justify-between text-gray-900",
                "hover:bg-amber-50 transition-colors",
                value.includes(option) && "bg-amber-50"
              )}
            >
              <span>{option}</span>
              {value.includes(option) && (
                <Check className="w-4 h-4 text-amber-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};