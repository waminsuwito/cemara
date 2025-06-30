
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { User, Vehicle, Report, Location } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

type AppDataContextType = {
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;

  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (vehicleId: string) => Promise<void>;
  
  reports: Report[];
  submitReport: (report: Omit<Report, 'id' | 'timestamp' | 'reportDate'>) => Promise<void>;
  
  locations: Location[];
  locationNames: string[];
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (location: Location) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
};

const AppDataContext = React.createContext<AppDataContextType | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);
  const { toast } = useToast();


  // DEBUG: Temporarily disable all data fetching to isolate publish error
  React.useEffect(() => {
    // We set empty data and mark as loaded to allow the app to render.
    // This will break functionality, but is a test to see if Firebase calls
    // are causing the build to fail.
    setIsDataLoaded(true);
  }, []);
  
  // CRUD functions are now placeholders to prevent runtime errors
  const addUser = async (user: Omit<User, 'id'>) => { console.log('addUser disabled for debugging'); };
  const updateUser = async (updatedUser: User) => { console.log('updateUser disabled for debugging'); };
  const deleteUser = async (userId: string) => { console.log('deleteUser disabled for debugging'); };

  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => { console.log('addVehicle disabled for debugging'); };
  const updateVehicle = async (updatedVehicle: Vehicle) => { console.log('updateVehicle disabled for debugging'); };
  const deleteVehicle = async (vehicleId: string) => { console.log('deleteVehicle disabled for debugging'); };

  const addLocation = async (location: Omit<Location, 'id'>) => { console.log('addLocation disabled for debugging'); };
  const updateLocation = async (updatedLocation: Location) => { console.log('updateLocation disabled for debugging'); };
  const deleteLocation = async (locationId: string) => { console.log('deleteLocation disabled for debugging'); };
  
  const submitReport = async (newReportData: Omit<Report, 'id' | 'timestamp' | 'reportDate'>) => {
    console.log('submitReport disabled for debugging');
    toast({
      variant: "destructive",
      title: "Fitur Dinonaktifkan",
      description: "Pengiriman laporan dinonaktifkan untuk sementara selama proses debug.",
    });
  };

  const locationNames = locations.map(l => l.namaBP).sort();

  const value = {
    users, addUser, updateUser, deleteUser,
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    reports, submitReport,
    locations, locationNames, addLocation, updateLocation, deleteLocation,
  };

  if (!isDataLoaded) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            Memuat data (Mode Debug)...
        </div>
    );
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = React.useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
