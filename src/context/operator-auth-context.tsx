'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/data';

type OperatorAuthContextType = {
  user: User | null;
  vehicle: string | null;
  login: (user: User, vehicle: string) => void;
  logout: () => void;
  isLoading: boolean;
};

const OperatorAuthContext = createContext<OperatorAuthContextType | null>(null);

export const OperatorAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem('operatorUser');
      const savedVehicle = sessionStorage.getItem('operatorVehicle');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedVehicle) {
        setVehicle(savedVehicle);
      }
    } catch (e) {
      console.error("Failed to parse operator from session storage", e);
      sessionStorage.removeItem('operatorUser');
      sessionStorage.removeItem('operatorVehicle');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User, vehicleData: string) => {
    setUser(userData);
    setVehicle(vehicleData);
    try {
        sessionStorage.setItem('operatorUser', JSON.stringify(userData));
        sessionStorage.setItem('operatorVehicle', vehicleData);
    } catch(e) {
        console.error("Failed to save operator to session storage", e);
    }
  };

  const logout = () => {
    setUser(null);
    setVehicle(null);
    sessionStorage.removeItem('operatorUser');
    sessionStorage.removeItem('operatorVehicle');
  };

  return (
    <OperatorAuthContext.Provider value={{ user, vehicle, login, logout, isLoading }}>
      {children}
    </OperatorAuthContext.Provider>
  );
};

export const useOperatorAuth = () => {
  const context = useContext(OperatorAuthContext);
  if (!context) {
    throw new Error('useOperatorAuth must be used within an OperatorAuthProvider');
  }
  return context;
};
