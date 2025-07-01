'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole } from '@/lib/data';

export type AdminUser = {
  username: string;
  role: UserRole;
  location?: string;
};

type AdminAuthContextType = {
  user: AdminUser | null;
  login: (user: AdminUser) => void;
  logout: () => void;
  isLoading: boolean;
};

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('adminUser');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from session storage", e);
      sessionStorage.removeItem('adminUser');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: AdminUser) => {
    setUser(userData);
    try {
        sessionStorage.setItem('adminUser', JSON.stringify(userData));
    } catch(e) {
        console.error("Failed to save user to session storage", e);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('adminUser');
  };

  return (
    <AdminAuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
