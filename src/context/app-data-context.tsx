
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Vehicle, Report, Location, ReportItem, Complaint, Suggestion, MechanicTask, SparePartLog, Penalty, Notification, UserRole } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, getDocs, Timestamp, deleteField, writeBatch } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAdminAuth } from './admin-auth-context';
import { useOperatorAuth } from './operator-auth-context';

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
  submitReport: (report: Omit<Report, 'id' | 'timestamp' | 'reportDate'>, reportIdToUpdate?: string) => Promise<void>;
  deleteReport: (reportId: string) => Promise<void>;

  complaints: Complaint[];
  addComplaint: (complaint: Omit<Complaint, 'id' | 'timestamp' | 'status'>) => Promise<void>;
  updateComplaintStatus: (complaintId: string, status: Complaint['status']) => Promise<void>;
  deleteComplaint: (complaintId: string) => Promise<void>;
  
  suggestions: Suggestion[];
  addSuggestion: (suggestion: Omit<Suggestion, 'id' | 'timestamp'>) => Promise<void>;
  deleteSuggestion: (suggestionId: string) => Promise<void>;

  mechanicTasks: MechanicTask[];
  addMechanicTask: (task: Omit<MechanicTask, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateMechanicTask: (taskId: string, updates: Partial<Pick<MechanicTask, 'status' | 'delayReason'>>) => Promise<void>;
  deleteMechanicTask: (taskId: string) => Promise<void>;
  
  sparePartLogs: SparePartLog[];
  addSparePartLog: (log: Omit<SparePartLog, 'id' | 'logDate' | 'loggedById' | 'loggedByName'>) => Promise<void>;
  deleteSparePartLog: (logId: string) => Promise<void>;

  penalties: Penalty[];
  addPenalty: (penaltyToAdd: Omit<Penalty, 'id' | 'timestamp' | 'givenByAdminUsername'>) => Promise<void>;
  deletePenalty: (penaltyId: string) => Promise<void>;

  notifications: Notification[];
  markNotificationsAsRead: (userId: string) => Promise<void>;

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
  const [mechanicTasks, setMechanicTasks] = useState<MechanicTask[]>([]);
  const [sparePartLogs, setSparePartLogs] = useState<SparePartLog[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAdminAuth();
  const { user: operatorUser } = useOperatorAuth();

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

  // Effect for protected data (loaded only for logged-in users)
  useEffect(() => {
    if (adminUser || operatorUser) {
      const protectedCollections = [
          { name: 'reports', setter: setReports, orderByField: 'timestamp' },
          { name: 'complaints', setter: setComplaints, orderByField: 'timestamp' },
          { name: 'suggestions', setter: setSuggestions, orderByField: 'timestamp' },
          { name: 'mechanicTasks', setter: setMechanicTasks, orderByField: 'createdAt' },
          { name: 'sparePartLogs', setter: setSparePartLogs, orderByField: 'logDate' },
          { name: 'penalties', setter: setPenalties, orderByField: 'timestamp' },
          { name: 'notifications', setter: setNotifications, orderByField: 'timestamp' },
      ];

      const unsubscribes = protectedCollections.map(({ name, setter, orderByField }) => {
          const q = query(collection(db, name));
          return onSnapshot(q, (querySnapshot) => {
              const data = querySnapshot.docs.map((doc) => {
                  const docData = doc.data();
                  // Convert all Timestamps to milliseconds for easier handling on client
                  Object.keys(docData).forEach(key => {
                      if (docData[key] instanceof Timestamp) {
                          docData[key] = docData[key].toMillis();
                      }
                  });
                  return { id: doc.id, ...docData };
              });
              // Sort descending by timestamp locally
              data.sort((a: any, b: any) => (b[orderByField] || 0) - (a[orderByField] || 0));
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
      // If user logs out, clear the sensitive data
      setReports([]);
      setComplaints([]);
      setSuggestions([]);
      setMechanicTasks([]);
      setSparePartLogs([]);
      setPenalties([]);
      setNotifications([]);
    }
  }, [adminUser, operatorUser, toast]);


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
  
  const submitReport = async (newReportData: Omit<Report, 'id' | 'timestamp' | 'reportDate'>, reportIdToUpdate?: string): Promise<void> => {
    const today = new Date();
    const reportDateStr = format(today, 'yyyy-MM-dd');

    const vehicle = vehicles.find(v => v.hullNumber === newReportData.vehicleId);
    if (!vehicle) {
        throw new Error(`Kendaraan dengan nomor lambung ${newReportData.vehicleId} tidak ditemukan.`);
    }

    const reportWithTimestamp = {
        ...newReportData,
        timestamp: serverTimestamp(),
        reportDate: reportDateStr,
    };
    
    const batch = writeBatch(db);

    if (reportIdToUpdate) {
        const reportRef = doc(db, 'reports', reportIdToUpdate);
        batch.update(reportRef, reportWithTimestamp as any);
    } else {
        const reportRef = doc(collection(db, 'reports'));
        batch.set(reportRef, reportWithTimestamp);
        
        // Notification logic for new reports ('Rusak' or 'Baik')
        if (newReportData.overallStatus === 'Rusak' || newReportData.overallStatus === 'Baik') {
            const adminRoles: UserRole[] = ['SUPER_ADMIN', 'LOCATION_ADMIN', 'MEKANIK', 'LOGISTIK'];
            const usersToNotify = users.filter(u => 
                adminRoles.includes(u.role) && 
                (u.role === 'SUPER_ADMIN' || u.location === newReportData.location)
            );

            const isDamage = newReportData.overallStatus === 'Rusak';
            const title = isDamage ? `Laporan Kerusakan Baru` : `Laporan Kondisi Baik`;
            const message = isDamage 
                ? `Kendaraan ${vehicle?.licensePlate || newReportData.vehicleId} dilaporkan rusak oleh ${newReportData.operatorName}.`
                : `Kendaraan ${vehicle?.licensePlate || newReportData.vehicleId} dilaporkan dalam kondisi Baik oleh ${newReportData.operatorName}.`;
            const type = isDamage ? 'DAMAGE' : 'SUCCESS';

            for (const userToNotify of usersToNotify) {
                const notificationRef = doc(collection(db, 'notifications'));
                batch.set(notificationRef, {
                    userId: userToNotify.id,
                    title,
                    message,
                    timestamp: serverTimestamp(),
                    isRead: false,
                    type,
                });
            }
        }
    }

    await batch.commit();
  };
  
  const deleteReport = async (reportId: string) => {
    try {
      await deleteDoc(doc(db, 'reports', reportId));
      toast({ title: "Sukses", description: "Riwayat laporan berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting report: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus riwayat laporan." });
    }
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
  
  const deleteComplaint = async (complaintId: string) => {
    try {
      await deleteDoc(doc(db, 'complaints', complaintId));
      toast({ title: "Sukses", description: "Data komplain berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting complaint: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus komplain." });
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
  
  const deleteSuggestion = async (suggestionId: string) => {
    try {
      await deleteDoc(doc(db, 'suggestions', suggestionId));
      toast({ title: "Sukses", description: "Data usulan berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting suggestion: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus usulan." });
    }
  };
  
  const addMechanicTask = async (taskData: Omit<MechanicTask, 'id' | 'createdAt' | 'status'>) => {
    try {
      await addDoc(collection(db, 'mechanicTasks'), {
        ...taskData,
        status: 'PENDING',
        createdAt: serverTimestamp(),
      });
      toast({ title: "Sukses", description: "Target pekerjaan baru berhasil ditambahkan." });
    } catch (e) {
      console.error("Error adding mechanic task: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menambahkan target pekerjaan." });
      throw e;
    }
  };
  
  const updateMechanicTask = async (taskId: string, updates: Partial<Pick<MechanicTask, 'status' | 'delayReason'>>) => {
    try {
      const taskBeingUpdated = mechanicTasks.find(t => t.id === taskId);
      if (!taskBeingUpdated) {
        throw new Error("Tugas tidak ditemukan.");
      }
      
      const updatePayload: { [key: string]: any } = { ...updates };

      if (updates.status === 'IN_PROGRESS' && !taskBeingUpdated.startedAt) {
        updatePayload.startedAt = serverTimestamp();
      }
      if (updates.status === 'COMPLETED' && !taskBeingUpdated.completedAt) {
        updatePayload.completedAt = serverTimestamp();
      }
      
      if (updates.status !== 'DELAYED' && taskBeingUpdated.delayReason) {
        updatePayload.delayReason = deleteField();
      }

      const batch = writeBatch(db);
      const taskRef = doc(db, 'mechanicTasks', taskId);
      batch.update(taskRef, updatePayload);

      // If the task is completed, create a new "Baik" report and notifications.
      if (updates.status === 'COMPLETED') {
        const vehicleInTask = taskBeingUpdated.vehicle;
        const vehicleDetails = vehicles.find(v => v.hullNumber === vehicleInTask.hullNumber);

        if (vehicleInTask && vehicleDetails) {
            // Create "Baik" report
            const goodConditionReport = {
              vehicleId: vehicleDetails.hullNumber,
              vehicleType: vehicleDetails.type,
              operatorName: `Diperbaiki oleh Tim Mekanik`,
              location: vehicleDetails.location,
              overallStatus: 'Baik' as const,
              items: [],
              kerusakanLain: { keterangan: `Perbaikan selesai: ${vehicleInTask.repairDescription}` },
              timestamp: serverTimestamp(),
              reportDate: format(new Date(), 'yyyy-MM-dd'),
            };
            const goodReportRef = doc(collection(db, 'reports'));
            batch.set(goodReportRef, goodConditionReport);

            // Create Notifications
            const operatorUser = users.find(u => u.name === vehicleDetails.operator && (u.role === 'OPERATOR' || u.role === 'KEPALA_BP'));
            const adminRoles: UserRole[] = ['SUPER_ADMIN', 'LOCATION_ADMIN', 'MEKANIK', 'LOGISTIK'];
            const adminUsersToNotify = users.filter(u => 
                adminRoles.includes(u.role) && 
                (u.role === 'SUPER_ADMIN' || u.location === vehicleDetails.location)
            );

            const allUsersToNotify = [...adminUsersToNotify];
            if (operatorUser && !allUsersToNotify.find(u => u.id === operatorUser.id)) {
                allUsersToNotify.push(operatorUser);
            }

            const title = `Perbaikan Selesai`;
            const message = `Perbaikan untuk kendaraan ${vehicleDetails.licensePlate} (${vehicleInTask.repairDescription}) telah selesai.`;

            for (const userToNotify of allUsersToNotify) {
                const notificationRef = doc(collection(db, 'notifications'));
                batch.set(notificationRef, {
                    userId: userToNotify.id,
                    title,
                    message,
                    timestamp: serverTimestamp(),
                    isRead: false,
                    type: 'SUCCESS',
                });
            }
            toast({ title: "Status Kendaraan Diperbarui", description: `Kendaraan ${vehicleDetails.licensePlate} telah ditandai 'Baik'.` });
        }
      }

      await batch.commit();
      toast({ title: "Sukses", description: "Status pekerjaan berhasil diperbarui." });

    } catch (e) {
      console.error("Error updating mechanic task: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui status pekerjaan." });
    }
  };

  const deleteMechanicTask = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, 'mechanicTasks', taskId));
      toast({ title: "Sukses", description: "Target pekerjaan berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting mechanic task: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus target pekerjaan." });
    }
  };

  const addSparePartLog = async (logData: Omit<SparePartLog, 'id' | 'logDate' | 'loggedById' | 'loggedByName'>) => {
    if (!adminUser || !adminUser.username) {
        toast({ variant: "destructive", title: "Error", description: "Anda harus login untuk melakukan aksi ini." });
        throw new Error("User not logged in");
    }
    try {
      await addDoc(collection(db, 'sparePartLogs'), {
        ...logData,
        logDate: serverTimestamp(),
        loggedById: adminUser.username, 
        loggedByName: adminUser.username,
      });
      toast({ title: "Sukses", description: "Data spare part berhasil disimpan." });
    } catch (e) {
      console.error("Error adding spare part log: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan data spare part." });
      throw e;
    }
  };
  
  const deleteSparePartLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'sparePartLogs', logId));
      toast({ title: "Sukses", description: "Log suku cadang berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting spare part log: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus log suku cadang." });
    }
  };

  const addPenalty = async (penaltyToAdd: Omit<Penalty, 'id' | 'timestamp' | 'givenByAdminUsername'>) => {
    const penaltyGiver = adminUser ? adminUser.username : (operatorUser?.role === 'KEPALA_BP' ? operatorUser.name : null);

    if (!penaltyGiver) {
        toast({ variant: "destructive", title: "Aksi Gagal", description: "Anda tidak memiliki izin untuk memberikan penalti." });
        return;
    }
    try {
        const batch = writeBatch(db);

        // 1. Add penalty document
        const penaltyRef = doc(collection(db, 'penalties'));
        batch.set(penaltyRef, { 
            ...penaltyToAdd,
            timestamp: serverTimestamp(),
            givenByAdminUsername: penaltyGiver
        });

        // 2. Add notification document for the user
        const notificationRef = doc(collection(db, 'notifications'));
        batch.set(notificationRef, {
            userId: penaltyToAdd.userId,
            title: "Anda Menerima Penalty",
            message: `Anda menerima ${penaltyToAdd.points} penalty karena belum melakukan checklist untuk kendaraan ${penaltyToAdd.vehicleHullNumber}.`,
            timestamp: serverTimestamp(),
            isRead: false,
            type: 'PENALTY',
        });
        
        await batch.commit();
        toast({ title: "Sukses", description: `Penalty untuk ${penaltyToAdd.userName} telah dikirim.` });
    } catch (e) {
        console.error("Error adding penalty: ", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal mengirim data penalty." });
    }
  };
  
  const deletePenalty = async (penaltyId: string) => {
    try {
      await deleteDoc(doc(db, 'penalties', penaltyId));
      toast({ title: "Sukses", description: "Data penalti berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting penalty: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus penalti." });
    }
  };

  const markNotificationsAsRead = async (userId: string) => {
    const notificationsToUpdate = notifications.filter(n => n.userId === userId && !n.isRead);
    if (notificationsToUpdate.length === 0) return;

    const batch = writeBatch(db);
    notificationsToUpdate.forEach(n => {
        const notifRef = doc(db, 'notifications', n.id);
        batch.update(notifRef, { isRead: true });
    });

    try {
        await batch.commit();
    } catch (e) {
        console.error("Error marking notifications as read:", e);
        toast({ variant: "destructive", title: "Error", description: "Gagal menandai pesan sebagai sudah dibaca." });
    }
  };

  const locationNames = locations.map(l => l.namaBP).sort();

  const value = {
    users, addUser, updateUser, deleteUser,
    vehicles, addVehicle, updateVehicle, deleteVehicle,
    reports, submitReport, deleteReport,
    complaints, addComplaint, updateComplaintStatus, deleteComplaint,
    suggestions, addSuggestion, deleteSuggestion,
    mechanicTasks, addMechanicTask, updateMechanicTask, deleteMechanicTask,
    sparePartLogs, addSparePartLog, deleteSparePartLog,
    penalties, addPenalty, deletePenalty,
    notifications,
    markNotificationsAsRead,
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
