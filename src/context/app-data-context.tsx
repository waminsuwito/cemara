
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialUsers, initialVehicles, initialReports, initialLocations, User, Vehicle, Report, Location } from '@/lib/data';
import { isSameDay } from 'date-fns';

// Helper function to get data from localStorage, ensuring it only runs on the client
const getFromStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper function to set data to localStorage
const saveToStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') {
        console.warn('Cannot save to storage: not in browser context.');
        return;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};

const USERS_STORAGE_KEY = 'app_users';
const VEHICLES_STORAGE_KEY = 'app_vehicles';
const REPORTS_STORAGE_KEY = 'app_reports';
const LOCATIONS_STORAGE_KEY = 'app_locations';

type AppDataContextType = {
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: number) => void;

  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (vehicleId: number) => void;
  
  reports: Report[];
  submitReport: (report: Omit<Report, 'id' | 'timestamp'>) => void;
  
  locations: Location[];
  locationNames: string[];
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (location: Location) => void;
  deleteLocation: (locationId: number) => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load initial data from localStorage on mount
  useEffect(() => {
    setUsers(getFromStorage(USERS_STORAGE_KEY, initialUsers));
    setVehicles(getFromStorage(VEHICLES_STORAGE_KEY, initialVehicles));
    setReports(getFromStorage(REPORTS_STORAGE_KEY, initialReports));
    setLocations(getFromStorage(LOCATIONS_STORAGE_KEY, initialLocations));
    setIsDataLoaded(true);
  }, []);
  
  // Persist state to localStorage whenever it changes, but only after initial load
  useEffect(() => { if (isDataLoaded) saveToStorage(USERS_STORAGE_KEY, users); }, [users, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) saveToStorage(VEHICLES_STORAGE_KEY, vehicles); }, [vehicles, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) saveToStorage(REPORTS_STORAGE_KEY, reports); }, [reports, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) saveToStorage(LOCATIONS_STORAGE_KEY, locations); }, [locations, isDataLoaded]);
  
  // CRUD for Users
  const addUser = (user: Omit<User, 'id'>) => setUsers(prev => [...prev, { ...user, id: Date.now() }]);
  const updateUser = (updatedUser: User) => setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  const deleteUser = (userId: number) => setUsers(prev => prev.filter(u => u.id !== userId));

  // CRUD for Vehicles
  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => setVehicles(prev => [...prev, { ...vehicle, id: Date.now() }]);
  const updateVehicle = (updatedVehicle: Vehicle) => setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  const deleteVehicle = (vehicleId: number) => setVehicles(prev => prev.filter(v => v.id !== vehicleId));

  // CRUD for Locations
  const addLocation = (location: Omit<Location, 'id'>) => setLocations(prev => [...prev, { ...location, id: Date.now() }]);
  const updateLocation = (updatedLocation: Location) => setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
  const deleteLocation = (locationId: number) => setLocations(prev => prev.filter(l => l.id !== locationId));
  
  const submitReport = (newReportData: Omit<Report, 'id' | 'timestamp'>) => {
    const timestamp = Date.now();
    const newReport: Report = {
      ...newReportData,
      id: String(timestamp),
      timestamp,
    };

    setReports(prevReports => {
      const today = new Date();
      const existingReportIndex = prevReports.findIndex(
        (r) => r.vehicleId === newReport.vehicleId && isSameDay(new Date(r.timestamp), today)
      );

      if (existingReportIndex !== -1) {
        const updatedReports = [...prevReports];
        updatedReports[existingReportIndex] = newReport;
        return updatedReports;
      } else {
        return [...prevReports, newReport];
      }
    });
  };

  const locationNames = locations.map(l => l.namaBP);

  const value = {
    users, addUser, updateUser, deleteUser,
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    reports, submitReport,
    locations, locationNames, addLocation, updateLocation, deleteLocation,
  };

  if (!isDataLoaded) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            Memuat...
        </div>
    );
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
