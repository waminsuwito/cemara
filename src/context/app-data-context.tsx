
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Vehicle, Report, Location } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";

type AppDataContextType = {
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (vehicle: Vehicle) => void;
  deleteVehicle: (vehicleId: string) => void;
  
  reports: Report[];
  submitReport: (report: Omit<Report, 'id' | 'timestamp'>) => void;
  
  locations: Location[];
  locationNames: string[];
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (location: Location) => void;
  deleteLocation: (locationId: string) => void;
};

const AppDataContext = createContext<AppDataContextType | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoaded(false);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);

        const vehiclesSnapshot = await getDocs(collection(db, "vehicles"));
        const vehiclesList = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        setVehicles(vehiclesList);

        const reportsSnapshot = await getDocs(collection(db, "reports"));
        const reportsList = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Firestore timestamps need to be converted to JS numbers
            const timestamp = data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp;
            return {
                id: doc.id,
                ...data,
                timestamp,
            } as Report
        }).sort((a, b) => b.timestamp - a.timestamp);
        setReports(reportsList);

        const locationsSnapshot = await getDocs(collection(db, "locations"));
        const locationsList = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
        setLocations(locationsList);

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
      } finally {
        setIsDataLoaded(true);
      }
    };
    fetchData();
  }, []);
  
  // CRUD for Users
  const addUser = async (user: Omit<User, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, "users"), user);
        setUsers(prev => [...prev, { ...user, id: docRef.id }]);
    } catch (e) {
        console.error("Error adding user: ", e);
    }
  };
  const updateUser = async (updatedUser: User) => {
    const userDoc = doc(db, "users", updatedUser.id);
    const { id, ...dataToUpdate } = updatedUser;
    await updateDoc(userDoc, dataToUpdate);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // CRUD for Vehicles
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    const docRef = await addDoc(collection(db, "vehicles"), vehicle);
    setVehicles(prev => [...prev, { ...vehicle, id: docRef.id }]);
  };
  const updateVehicle = async (updatedVehicle: Vehicle) => {
    const vehicleDoc = doc(db, "vehicles", updatedVehicle.id);
    const { id, ...dataToUpdate } = updatedVehicle;
    await updateDoc(vehicleDoc, dataToUpdate);
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
  };
  const deleteVehicle = async (vehicleId: string) => {
    await deleteDoc(doc(db, "vehicles", vehicleId));
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
  };

  // CRUD for Locations
  const addLocation = async (location: Omit<Location, 'id'>) => {
    const docRef = await addDoc(collection(db, "locations"), location);
    setLocations(prev => [...prev, { ...location, id: docRef.id }]);
  };
  const updateLocation = async (updatedLocation: Location) => {
    const locationDoc = doc(db, "locations", updatedLocation.id);
    const { id, ...dataToUpdate } = updatedLocation;
    await updateDoc(locationDoc, dataToUpdate);
    setLocations(prev => prev.map(l => l.id === updatedLocation.id ? updatedLocation : l));
  };
  const deleteLocation = async (locationId: string) => {
    await deleteDoc(doc(db, "locations", locationId));
    setLocations(prev => prev.filter(l => l.id !== locationId));
  };
  
  const submitReport = async (newReportData: Omit<Report, 'id' | 'timestamp'>) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const q = query(collection(db, "reports"), 
        where("vehicleId", "==", newReportData.vehicleId),
        where("timestamp", ">=", todayStart),
        where("timestamp", "<=", todayEnd)
    );

    const querySnapshot = await getDocs(q);

    const reportWithTimestamp = {
        ...newReportData,
        timestamp: new Date()
    };
    
    if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "reports", existingDoc.id), reportWithTimestamp);
        setReports(prev => prev.map(r => r.id === existingDoc.id ? { ...reportWithTimestamp, id: existingDoc.id, timestamp: reportWithTimestamp.timestamp.getTime() } : r).sort((a,b) => b.timestamp - a.timestamp));
    } else {
        const docRef = await addDoc(collection(db, "reports"), reportWithTimestamp);
        setReports(prev => [...prev, { ...reportWithTimestamp, id: docRef.id, timestamp: reportWithTimestamp.timestamp.getTime() }].sort((a,b) => b.timestamp - a.timestamp));
    }
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
            Memuat data dari Firestore...
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
