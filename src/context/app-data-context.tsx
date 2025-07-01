
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Vehicle, Report, Location, ReportItem, Complaint, Suggestion } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, getDocs, Timestamp, deleteField } from "firebase/firestore";
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

  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateComplaintStatus: (complaintId: string, status: Complaint['status']) => Promise<void>;
  
  suggestions: Suggestion[];
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'timestamp'>) => Promise<void>;
  
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
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAdminAuth();

  // Effect for public data (loaded for everyone)
  useEffect(() => {
    const collectionsToWatch = [
      { name: 'users', setter: setUsers },
      { name: 'vehicles', setter: setVehicles },
      { name: 'locations', setter: setLocations },
    ];
    
    let loadedCount = 0;
    const unsubscribes: (() => void)[] = [];

    if (collectionsToWatch.length === 0) {
        setIsDataLoaded(true);
        return;
    }

    const onCollectionLoaded = () => {
        loadedCount++;
        if (loadedCount === collectionsToWatch.length) {
            setIsDataLoaded(true);
        }
    };
    
    collectionsToWatch.forEach(({ name, setter }) => {
      const q = query(collection(db, name));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            // Convert any Timestamps to milliseconds
            Object.keys(docData).forEach(key => {
                if (docData[key] instanceof Timestamp) {
                    docData[key] = docData[key].toMillis();
                }
            });
            return { id: doc.id, ...docData };
        });
        setter(data as any);
        onCollectionLoaded();
      }, (error) => {
        console.error(`Error fetching ${name}: `, error);
        toast({
            variant: "destructive",
            title: `Gagal Memuat Data`,
            description: `Tidak dapat mengambil data untuk "${name}". Periksa aturan keamanan Firestore Anda.`,
            duration: 9000
        });
        onCollectionLoaded(); // Still count as "loaded" to not block the UI forever
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
      const protectedCollections = [
          { name: 'reports', setter: setReports, orderByField: 'timestamp' },
          { name: 'complaints', setter: setComplaints, orderByField: 'timestamp' },
          { name: 'suggestions', setter: setSuggestions, orderByField: 'timestamp' },
      ];

      const unsubscribes = protectedCollections.map(({ name, setter, orderByField }) => {
          const q = query(collection(db, name));
          return onSnapshot(q, (querySnapshot) => {
              const data = querySnapshot.docs.map((doc) => {
                  const docData = doc.data();
                  if (docData.timestamp && docData.timestamp instanceof Timestamp) {
                      docData.timestamp = docData.timestamp.toMillis();
                  }
                  return { id: doc.id, ...docData };
              });
              // Sort descending by timestamp locally
              data.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
              setter(data as any);
          }, (error) => {
              console.error(`Error fetching ${name}: `, error);
              toast({
                  variant: "destructive",
                  title: `Gagal Memuat Data ${name.charAt(0).toUpperCase() + name.slice(1)}`,
                  description: `Terjadi masalah saat mengambil data.`,
              });
          });
      });
    
      return () => unsubscribes.forEach(unsub => unsub());
    } else {
      // If admin logs out, clear the sensitive data
      setReports([]);
      setComplaints([]);
      setSuggestions([]);
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
    
    const updatePayload: { [key: string]: any } = {};

    Object.keys(userData).forEach((key) => {
      const typedKey = key as keyof typeof userData;
      const value = userData[typedKey];
      
      if (value === undefined) {
        updatePayload[key] = deleteField();
      } else {
        updatePayload[key] = value;
      }
    });
    
    try {
      await updateDoc(doc(db, 'users', id), updatePayload);
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
  
  const addComplaint = async (complaintData: Omit<Complaint, 'id' | 'timestamp' | 'status'>) => {
    try {
      await addDoc(collection(db, 'complaints'), {
        ...complaintData,
        status: 'OPEN',
        timestamp: serverTimestamp(),
      });
      toast({ title: "Sukses", description: "Komplain Anda berhasil dikirim." });
    } catch (e) {
      console.error("Error adding complaint: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal mengirim komplain." });
      throw e;
    }
  };

  const updateComplaintStatus = async (complaintId: string, status: Complaint['status']) => {
    try {
      await updateDoc(doc(db, 'complaints', complaintId), { status });
      toast({ title: "Sukses", description: `Status komplain berhasil diperbarui.` });
    } catch (e) {
      console.error("Error updating complaint status: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui status komplain." });
    }
  };

  const addSuggestion = async (suggestionData: Omit<Suggestion, 'id' | 'timestamp'>) => {
    try {
      await addDoc(collection(db, 'suggestions'), {
        ...suggestionData,
        timestamp: serverTimestamp(),
      });
      toast({ title: "Sukses", description: "Usulan Anda berhasil dikirim. Terima kasih atas masukannya." });
    } catch (e) {
      console.error("Error adding suggestion: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal mengirim usulan." });
      throw e;
    }
  };

  const locationNames = locations.map(l => l.namaBP).sort();

  const value = {
    users, addUser, updateUser, deleteUser,
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    reports, submitReport,
    complaints, addComplaint, updateComplaintStatus,
    suggestions, addSuggestion,
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
