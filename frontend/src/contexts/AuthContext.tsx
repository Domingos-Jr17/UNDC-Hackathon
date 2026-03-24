import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../hooks/useApi';
import { User } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (code: string) => Promise<boolean>;
  staffLogin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, login, staffLogin, logout, loading, isAuthenticated } = useAuth();

  const value: AuthContextType = {
    user,
    login,
    staffLogin,
    logout,
    isLoading: loading,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
