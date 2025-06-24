// User and Authentication Types
export interface User {
  id: string;
  nume: string;
  email: string;
  rol: 'participant' | 'furnizor' | 'admin';
  evenimente_salvate?: string[];
  creat_la: Date;
  notifications?: {
    type: 'service_approved' | 'service_rejected' | 'request_accepted' | 'request_rejected' | 'event_confirmed' | 'new_message';
    message: string;
    createdAt: string;
    read: boolean;
    requestId?: string;
    eventName?: string;
    confirmedEventId?: string;
  }[];
}

export interface AuthContextType {
  currentUser: any;
  userData: User | null;
  setUserData: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  unreadNotifications: number;
  inregistrare: (email: string, parola: string, nume: string, rol: User['rol']) => Promise<void>;
  conectare: (email: string, parola: string) => Promise<void>;
  deconectare: () => Promise<void>;
  resetareParola: (email: string) => Promise<void>;
}

// Category and Event Types
export interface FirestoreCategory {
  name: string;
  description: string;
  imageUrl: string;
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  subcategories: string[];
  tags?: string[];
  vendorCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  categoryRef: any;
  subcategories: string[];
  tags: string[];
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  locations: string[];
  date: Date;
  imageUrl: string;
  furnizor: string;
  userId: string;
  numarTelefon: string;
  email: string;
  createdAt: Date;
  updatedAt?: Date;
  status?: string;
}

// Request and Approval Types
export interface ServiceRequest {
  id: string;
  eventId: string;
  eventName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  vendorId: string;
  message: string;
  location: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  messages?: {
    senderId: string;
    senderName: string;
    message: string;
    timestamp: Date;
  }[];
  confirmedEventId?: string;
}

export interface ServiceApprovalRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  service: {
    name: string;
    description: string;
    categoryId: string;
    categoryRef: any;
    subcategories: string[];
    price: {
      amount: number;
      type: 'per_hour' | 'per_event' | 'per_person';
    };
    locations: string[];
    date: Date;
    imageUrl: string;
    tags: string[];
  };
  status: 'pending' | 'approved' | 'rejected';
  adminFeedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfirmedEvent {
  id: string;
  eventId: string;
  requestId: string;
  eventName: string;
  userId: string;
  userName: string;
  vendorId: string;
  vendorName: string;
  serviceType: string;
  location: string;
  startDate: Date;
  endDate: Date;
  price: {
    amount: number;
    type: 'per_hour' | 'per_event' | 'per_person';
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vendor Types
export interface Vendor {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  imageUrl: string;
  subcategories: string[];
  rating: number;
  reviewCount: number;
  priceRange: {
    min: number;
    max: number;
  };
  location: string;
  contactInfo: {
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Form Types
export interface LoginFormInputs {
  email: string;
  password: string;
}

export interface RegisterFormInputs {
  nume: string;
  email: string;
  password: string;
  confirmPassword: string;
  rol: 'participant' | 'furnizor';
}

export interface ContactFormData {
  phone: string;
  location: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  message: string;
}

export interface ServiceFormData {
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

// UI Component Types
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export interface CardProps {
  className?: string;
  children: React.ReactNode;
  animate?: boolean;
  onClick?: () => void;
}

export interface InputProps {
  label?: string;
  helperText?: string;
  error?: string;
  fullWidth?: boolean;
  glassmorphism?: boolean;
  className?: string;
  leftIcon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

// Notification Types
export interface Notification {
  type: 'service_approved' | 'service_rejected' | 'request_accepted' | 'request_rejected' | 'event_confirmed' | 'new_message';
  message: string;
  createdAt: string;
  read: boolean;
  requestId?: string;
  eventName?: string;
  confirmedEventId?: string;
  data?: any;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  subcategories?: string[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Legacy Types (for backward compatibility)
export interface Categorie {
  id: string;
  nume: string;
  descriere: string;
  imagine: string;
  pret_minim: number;
  pret_maxim: number;
  subcategorii: {
    id: string;
    nume: string;
    descriere: string;
  }[];
}