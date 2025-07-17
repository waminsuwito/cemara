'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@/lib/data';

type OperatorAuthContextType = {
  user: User | null;
  vehicle: string | null; // This will store the selected vehicle's hullNumber
  login: (user: User, vehicle: string | null) => void;
  logout: () => void;
  selectVehicle: (vehicle: string) => void;
  isLoading: boolean;
};

const OperatorAuthContext = createContext<OperatorAuthContextType | null>(null);

export const OperatorAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('operatorUser');
      const savedVehicle = localStorage.getItem('operatorVehicle');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      if (savedVehicle) {
        setVehicle(savedVehicle);
      }
    } catch (e) {
      console.error("Failed to parse operator from local storage", e);
      localStorage.removeItem('operatorUser');
      localStorage.removeItem('operatorVehicle');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User, vehicleData: string | null) => {
    setUser(userData);
    setVehicle(vehicleData);
    try {
        localStorage.setItem('operatorUser', JSON.stringify(userData));
        if (vehicleData) {
          localStorage.setItem('operatorVehicle', vehicleData);
        } else {
          localStorage.removeItem('operatorVehicle');
        }
    } catch(e) {
        console.error("Failed to save operator to local storage", e);
    }
  };

  const logout = () => {
    setUser(null);
    setVehicle(null);
    localStorage.removeItem('operatorUser');
    localStorage.removeItem('operatorVehicle');
  };

  const selectVehicle = (vehicleData: string) => {
    setVehicle(vehicleData);
    try {
      localStorage.setItem('operatorVehicle', vehicleData);
    } catch (e) {
      console.error("Failed to save selected vehicle to local storage", e);
    }
  };

  return (
    <OperatorAuthContext.Provider value={{ user, vehicle, login, logout, selectVehicle, isLoading }}>
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
