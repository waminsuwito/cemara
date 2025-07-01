
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Vehicle, Report, Location, ReportItem } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, getDocs, Timestamp } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAdminAuth } from './admin-auth-context';

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
  submitReport: (report: Omit<Report, 'id' | 'timestamp' | 'reportDate'>) => Promise<'created' | 'updated'>;
  
  locations: Location[];
  locationNames: string[];
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (location: Location) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  isDataLoaded: boolean;
};

const AppDataContext = React.createContext<AppDataContextType | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAdminAuth();

  // Effect for public data (loaded for everyone)
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    let loadedCount = 0;
    const totalPublicCollections = 3; // users, vehicles, locations

    const collectionsToWatch = [
      { name: 'users', setter: setUsers },
      { name: 'vehicles', setter: setVehicles },
      { name: 'locations', setter: setLocations },
    ];
    
    collectionsToWatch.forEach(({ name, setter }) => {
      const q = query(collection(db, name));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            // Firestore timestamps need to be converted to JS milliseconds
            Object.keys(docData).forEach(key => {
                if (docData[key] instanceof Timestamp) {
                    docData[key] = docData[key].toMillis();
                }
            });
            return { id: doc.id, ...docData };
        });
        setter(data as any);
        
        loadedCount++;
        if(loadedCount >= totalPublicCollections && !isDataLoaded) {
            setIsDataLoaded(true);
        }

      }, (error) => {
        console.error(`Error fetching ${name}: `, error);
        toast({
            variant: "destructive",
            title: `Gagal Memuat Data ${name}`,
            description: "Pastikan aturan keamanan Firestore memperbolehkan akses baca (read).",
            duration: 9000
        });
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect for protected data (loaded only for logged-in admins)
  useEffect(() => {
    if (adminUser) {
      const q = query(collection(db, "reports"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map((doc) => {
          const docData = doc.data();
          if (docData.timestamp && docData.timestamp instanceof Timestamp) {
            docData.timestamp = docData.timestamp.toMillis();
          }
          return { id: doc.id, ...docData };
        }) as Report[];
        setReports(data);
      }, (error) => {
        console.error(`Error fetching reports: `, error);
        toast({
            variant: "destructive",
            title: `Gagal Memuat Data Laporan`,
            description: "Terjadi masalah saat mengambil data laporan. Silakan coba muat ulang halaman.",
        });
      });
      
      return () => unsubscribe();
    } else {
      // If admin logs out, clear the sensitive reports data
      setReports([]);
    }
  }, [adminUser, toast]);


  const addUser = async (userData: Omit<User, 'id'>) => {
    try {
      await addDoc(collection(db, 'users'), userData);
      toast({ title: "Sukses", description: "Pengguna baru berhasil ditambahkan." });
    } catch (e) {
      console.error("Error adding user: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menambahkan pengguna." });
    }
  };

  const updateUser = async (user: User) => {
    const { id, ...userData } = user;
    try {
      await updateDoc(doc(db, 'users', id), userData);
      toast({ title: "Sukses", description: "Data pengguna berhasil diperbarui." });
    } catch (e) {
      console.error("Error updating user: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui data pengguna." });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      toast({ title: "Sukses", description: "Pengguna berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting user: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus pengguna." });
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, 'id'>) => {
    try {
        await addDoc(collection(db, 'vehicles'), vehicleData);
        toast({ title: "Sukses", description: "Alat baru berhasil ditambahkan." });
    } catch (e) {
        console.error("Error adding vehicle: ", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal menambahkan alat." });
    }
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    const { id, ...vehicleData } = vehicle;
    try {
        await updateDoc(doc(db, 'vehicles', id), vehicleData);
        toast({ title: "Sukses", description: "Data alat berhasil diperbarui." });
    } catch (e) {
        console.error("Error updating vehicle: ", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui data alat." });
    }
  };

  const deleteVehicle = async (vehicleId: string) => {
    try {
        await deleteDoc(doc(db, 'vehicles', vehicleId));
        toast({ title: "Sukses", description: "Alat berhasil dihapus." });
    } catch (e) {
        console.error("Error deleting vehicle: ", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal menghapus alat." });
    }
  };
  
  const addLocation = async (locationData: Omit<Location, 'id'>) => {
    try {
        await addDoc(collection(db, 'locations'), locationData);
        toast({ title: "Sukses", description: "Lokasi baru berhasil ditambahkan." });
    } catch (e) {
        console.error("Error adding location: ", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal menambahkan lokasi." });
    }
  };

  const updateLocation = async (location: Location) => {
      const { id, ...locationData } = location;
      try {
          await updateDoc(doc(db, 'locations', id), locationData);
          toast({ title: "Sukses", description: "Data lokasi berhasil diperbarui." });
      } catch (e) {
          console.error("Error updating location: ", e);
          toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui data lokasi." });
      }
  };

  const deleteLocation = async (locationId: string) => {
      try {
          await deleteDoc(doc(db, 'locations', locationId));
          toast({ title: "Sukses", description: "Lokasi berhasil dihapus." });
      } catch (e) {
          console.error("Error deleting location: ", e);
          toast({ variant: "destructive", title: "Error", description: "Gagal menghapus lokasi." });
      }
  };
  
  const submitReport = async (newReportData: Omit<Report, 'id' | 'timestamp' | 'reportDate'>): Promise<'created' | 'updated'> => {
    const today = new Date();
    const reportDateStr = format(today, 'yyyy-MM-dd');
    
    const vehicle = vehicles.find(v => v.hullNumber === newReportData.vehicleId);
    if (!vehicle) {
        throw new Error(`Kendaraan dengan nomor lambung ${newReportData.vehicleId} tidak ditemukan.`);
    }

    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where("vehicleId", "==", newReportData.vehicleId), where("reportDate", "==", reportDateStr));
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        const reportWithTimestamp = {
          ...newReportData,
          timestamp: serverTimestamp(),
          reportDate: reportDateStr,
        };
        await addDoc(collection(db, 'reports'), reportWithTimestamp);
        return 'created';
    }

    const existingReportDoc = querySnapshot.docs[0];
    const existingReportData = existingReportDoc.data() as Report;

    if (newReportData.overallStatus === 'Baik') {
        await updateDoc(existingReportDoc.ref, {
            overallStatus: 'Baik',
            items: [],
            kerusakanLain: null,
            timestamp: serverTimestamp()
        });
        return 'updated';
    }

    const combinedItemsMap = new Map<string, ReportItem>();
    (existingReportData.items || []).forEach(item => combinedItemsMap.set(item.id, item));
    (newReportData.items || []).forEach(item => combinedItemsMap.set(item.id, item));
    const finalItems = Array.from(combinedItemsMap.values());

    const finalKerusakanLain: { keterangan: string, foto?: string } | null = (() => {
        const newDesc = newReportData.kerusakanLain?.keterangan;
        const newFoto = newReportData.kerusakanLain?.foto;
        const oldDesc = existingReportData.kerusakanLain?.keterangan;
        const oldFoto = existingReportData.kerusakanLain?.foto;

        if (!newDesc && !newFoto) {
            return existingReportData.kerusakanLain || null;
        }

        const combinedDesc = newDesc 
            ? (oldDesc ? `${oldDesc}\\n---\\nLaporan Tambahan: ${newDesc}` : newDesc)
            : (oldDesc || '');
      
        const finalFoto = newFoto || oldFoto;

        if (!combinedDesc) return null;

        const result: { keterangan: string, foto?: string } = {
            keterangan: combinedDesc
        };

        if (finalFoto) {
            result.foto = finalFoto;
        }

        return result;
    })();
    
    let finalOverallStatus: Report['overallStatus'] = 'Baik';
    const hasRusak = finalItems.some(item => item.status === 'RUSAK') || (finalKerusakanLain && finalKerusakanLain.keterangan);
    const hasPerhatian = finalItems.some(item => item.status === 'PERLU PERHATIAN');
    
    if (hasRusak) {
        finalOverallStatus = 'Rusak';
    } else if (hasPerhatian) {
        finalOverallStatus = 'Perlu Perhatian';
    }

    const updateData = {
        items: finalItems,
        kerusakanLain: finalKerusakanLain,
        overallStatus: finalOverallStatus,
        timestamp: serverTimestamp()
    };
    
    await updateDoc(existingReportDoc.ref, updateData);
    return 'updated';
  };

  const locationNames = locations.map(l => l.namaBP).sort();

  const value = {
    users, addUser, updateUser, deleteUser,
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    reports, submitReport,
    locations, locationNames, addLocation, updateLocation, deleteLocation,
    isDataLoaded,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
