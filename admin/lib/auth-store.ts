import { create } from 'zustand';

export interface Admin {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin';
}

interface AuthStore {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (email: string, password: string) => {
    // This will be implemented with actual API call
    // For now, just a placeholder
    set({ admin: { id: '1', email, first_name: 'Admin', last_name: 'User', role: 'admin' }, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ admin: null, isAuthenticated: false });
  },
  checkAuth: async () => {
    // Check if token exists and is valid
    const token = localStorage.getItem('admin_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    // Token validation would happen here
    set({ isLoading: false });
  },
}));
