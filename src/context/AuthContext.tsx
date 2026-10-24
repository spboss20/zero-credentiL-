import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api.ts';
import type { User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  loading: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  login: (email: string, role?: UserRole) => Promise<void>;
  register: (name: string, email: string, role: UserRole, organization?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await api.getCurrentUser();
      setUser(res.user);
    } catch (err) {
      console.error('Failed to load user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const switchRole = async (targetRole: UserRole) => {
    setLoading(true);
    try {
      const res = await api.switchRole(targetRole);
      setUser(res.user);
    } catch (err) {
      console.error('Role switch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, role?: UserRole) => {
    setLoading(true);
    try {
      const res = await api.login({ email, role });
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, targetRole: UserRole, organization?: string) => {
    setLoading(true);
    try {
      const res = await api.register({ name, email, role: targetRole, organization });
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const role = user?.role || 'holder';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        switchRole,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
