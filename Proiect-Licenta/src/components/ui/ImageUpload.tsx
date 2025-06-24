import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { clsx } from 'clsx';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  error?: string;
  label?: string;
  glassmorphism?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onUpload, 
  error, 
  label,
  glassmorphism = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validare tip fișier
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return 'Doar fișierele JPG și PNG sunt acceptate';
    }

    // Validare dimensiune (10MB = 10 * 1024 * 1024 bytes)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Imaginea nu poate depăși 10MB';
    }

    // Validare dimensiune minimă (opțional)
    if (file.size < 1024) {
      return 'Imaginea este prea mică (minim 1KB)';
    }

    return null;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validare fișier
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `events/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      onUpload(downloadURL);
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError('Eroare la încărcarea imaginii. Încercați din nou.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onUpload('');
  };

  const displayError = error || uploadError;

  return (
    <div>
      {label && (
        <label className={clsx(
          "block text-sm font-medium mb-2",
          glassmorphism ? "text-white/80" : "text-gray-700"
        )}>
          {label}
        </label>
      )}

      <div className={clsx(
        "flex justify-center px-6 pt-5 pb-6 rounded-lg transition-all",
        glassmorphism ? (
          "bg-white/70 border-transparent"
        ) : (
          "border-2 border-dashed border-gray-300"
        ),
        displayError && "border-red-300"
      )}>
        <div className="space-y-1 text-center">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-32 w-auto object-cover rounded-md"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 p-1 bg-red-100 rounded-full text-red-600 hover:bg-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {uploading ? (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
              ) : (
                <>
                  <ImageIcon className={clsx(
                    "mx-auto h-12 w-12",
                    glassmorphism ? "text-gray-600" : "text-gray-400"
                  )} />
                  <div className="flex text-sm">
                    <label
                      htmlFor="file-upload"
                      className={clsx(
                        "relative cursor-pointer rounded-md font-medium",
                        "focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2",
                        glassmorphism ? (
                          "text-amber-600 hover:text-amber-700 focus-within:ring-white/60"
                        ) : (
                          "text-amber-600 hover:text-amber-500 focus-within:ring-amber-500"
                        )
                      )}
                    >
                      <span>Încarcă o imagine</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/jpg,image/png"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                  <p className={clsx(
                    "text-xs",
                    glassmorphism ? "text-gray-600" : "text-gray-500"
                  )}>
                    PNG, JPG până la 10MB
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {displayError && (
        <p className={clsx(
          "mt-1 text-sm",
          glassmorphism ? "text-red-300" : "text-red-600"
        )}>{displayError}</p>
      )}
    </div>
  );
};