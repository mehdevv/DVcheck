export interface User {
  id: string;
  uniqueId: string; // Custom unique ID for QR code
  email: string;
  name: string;
  role: 'admin' | 'member';
  phoneNumber?: string;
  school?: string;
  year?: number;
  department?: string;
  qrCode?: string; // Base64 QR code image
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  school?: string;
  year?: number;
  department?: string;
  role: 'admin' | 'member';
}

export interface Event {
  id: string;
  name: string;
  picture: string; // URL or base64 string
  description: string;
  members: string[]; // Array of user IDs
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEventData {
  name: string;
  picture: string;
  description: string;
  members: string[];
}
