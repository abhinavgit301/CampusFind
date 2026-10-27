import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    displayName: string;
    hostel?: string;
    roomNumber?: string;
    phoneNumber?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: Partial<User>) => Promise<void>;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const checkAuth = async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
    } catch (_err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setIsAuthModalOpen(false);
  };

  const register = async (payload: {
    email: string;
    password: string;
    displayName: string;
    hostel?: string;
    roomNumber?: string;
    phoneNumber?: string;
  }) => {
    const data = await api.post('/auth/register', payload);
    setUser(data.user);
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_e) {
      // Ignore network errors on logout
    }
    setUser(null);
  };

  const updateProfile = async (payload: Partial<User>) => {
    const data = await api.patch('/me', payload);
    setUser(data.user);
  };

  const openAuthModal = (tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
