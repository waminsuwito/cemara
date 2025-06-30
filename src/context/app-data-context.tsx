
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { User, Vehicle, Report, Location } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

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
  submitReport: (report: Omit<Report, 'id' | 'timestamp' | 'reportDate'>) => void;
  
  locations: Location[];
  locationNames: string[];
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (location: Location) => void;
  deleteLocation: (locationId: string) => void;
};

const AppDataContext = React.createContext<AppDataContextType | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = React.useState<User[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [reports, setReports] = React.useState<Report[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);
  const { toast } = useToast();


  React.useEffect(() => {
    const fetchData = async () => {
      try {
        // We are no longer using onSnapshot for real-time updates to debug the publish issue.
        // We will fetch the data once.
        const usersQuery = getDocs(collection(db, "users"));
        const vehiclesQuery = getDocs(collection(db, "vehicles"));
        const reportsQuery = getDocs(collection(db, "reports"));
        const locationsQuery = getDocs(collection(db, "locations"));

        const [usersSnapshot, vehiclesSnapshot, reportsSnapshot, locationsSnapshot] = await Promise.all([
          usersQuery,
          vehiclesQuery,
          reportsQuery,
          locationsQuery
        ]);

        const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        setUsers(usersList);

        const vehiclesList = vehiclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        setVehicles(vehiclesList);
        
        const reportsList = reportsSnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp;
            return { id: doc.id, ...data, timestamp } as Report;
        }).sort((a, b) => b.timestamp - a.timestamp);
        setReports(reportsList);

        const locationsList = locationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
        setLocations(locationsList);

      } catch (error) {
        console.error("Error fetching initial data:", error);
        toast({
            variant: "destructive",
            title: "Gagal Memuat Data",
            description: "Tidak dapat mengambil data dari server. Periksa koneksi internet Anda.",
        });
      } finally {
        setIsDataLoaded(true);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // CRUD for Users
  const addUser = async (user: Omit<User, 'id'>) => {
    try {
        await addDoc(collection(db, "users"), user);
    } catch (e) {
        console.error("Error adding user: ", e);
    }
  };
  const updateUser = async (updatedUser: User) => {
    const userDoc = doc(db, "users", updatedUser.id);
    const { id, ...dataToUpdate } = updatedUser;
    await updateDoc(userDoc, dataToUpdate);
  };
  const deleteUser = async (userId: string) => {
    await deleteDoc(doc(db, "users", userId));
  };

  // CRUD for Vehicles
  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    await addDoc(collection(db, "vehicles"), vehicle);
  };
  const updateVehicle = async (updatedVehicle: Vehicle) => {
    const vehicleDoc = doc(db, "vehicles", updatedVehicle.id);
    const { id, ...dataToUpdate } = updatedVehicle;
    await updateDoc(vehicleDoc, dataToUpdate);
  };
  const deleteVehicle = async (vehicleId: string) => {
    await deleteDoc(doc(db, "vehicles", vehicleId));
  };

  // CRUD for Locations
  const addLocation = async (location: Omit<Location, 'id'>) => {
    await addDoc(collection(db, "locations"), location);
  };
  const updateLocation = async (updatedLocation: Location) => {
    const locationDoc = doc(db, "locations", updatedLocation.id);
    const { id, ...dataToUpdate } = updatedLocation;
    await updateDoc(locationDoc, dataToUpdate);
  };
  const deleteLocation = async (locationId: string) => {
    await deleteDoc(doc(db, "locations", locationId));
  };
  
  const submitReport = async (newReportData: Omit<Report, 'id' | 'timestamp' | 'reportDate'>) => {
    const today = new Date();
    const reportDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const q = query(collection(db, "reports"), 
        where("vehicleId", "==", newReportData.vehicleId),
        where("reportDate", "==", reportDate)
    );

    const querySnapshot = await getDocs(q);

    const reportWithTimestamp = {
        ...newReportData,
        timestamp: new Date(),
        reportDate: reportDate
    };
    
    if (!querySnapshot.empty) {
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "reports", existingDoc.id), reportWithTimestamp);
    } else {
        await addDoc(collection(db, "reports"), reportWithTimestamp);
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
  const context = React.useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
