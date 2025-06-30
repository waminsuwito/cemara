
'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { User, Vehicle, Report, Location } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
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
    // Flag to ensure we only set isDataLoaded once
    let initialLoadsPending = 4;
    const markLoadComplete = () => {
      initialLoadsPending--;
      if (initialLoadsPending === 0 && !isDataLoaded) {
        setIsDataLoaded(true);
      }
    };

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersList);
      markLoadComplete();
    }, (error) => {
      console.error("Error fetching users:", error);
      markLoadComplete();
    });

    const unsubVehicles = onSnapshot(collection(db, "vehicles"), (snapshot) => {
      const vehiclesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
      setVehicles(vehiclesList);
      markLoadComplete();
    }, (error) => {
      console.error("Error fetching vehicles:", error);
      markLoadComplete();
    });

    const unsubReports = onSnapshot(collection(db, "reports"), (snapshot) => {
      const reportsList = snapshot.docs.map(doc => {
          const data = doc.data();
          const timestamp = data.timestamp?.toMillis ? data.timestamp.toMillis() : data.timestamp;
          return { id: doc.id, ...data, timestamp } as Report;
      }).sort((a, b) => b.timestamp - a.timestamp);
      setReports(reportsList);
      markLoadComplete();
    }, (error) => {
      console.error("Error fetching reports:", error);
      markLoadComplete();
    });
    
    const unsubLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
      const locationsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
      setLocations(locationsList);
      markLoadComplete();
    }, (error) => {
      console.error("Error fetching locations:", error);
      markLoadComplete();
    });

    // Cleanup function to unsubscribe from listeners on component unmount
    return () => {
      unsubUsers();
      unsubVehicles();
      unsubReports();
      unsubLocations();
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  
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
