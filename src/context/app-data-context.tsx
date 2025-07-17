
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Vehicle, Report, Location, Complaint, Suggestion, MechanicTask, SparePartLog, Penalty, Notification, UserRole, NotificationType, initialLocations, Attendance, Ritasi, JobMixFormula } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp, getDocs, Timestamp, deleteField, writeBatch, orderBy, limit } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { format, startOfToday, isSameDay, isBefore } from 'date-fns';
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
  submitReport: (report: Omit<Report, 'id' | 'timestamp' | 'reportDate'>, submittedBy: 'operator' | 'mechanic', repairerName?: string) => Promise<void>;
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
  
  addAttendance: (attendanceData: Omit<Attendance, 'id' | 'timestamp' | 'date'>) => Promise<void>;
  getTodayAttendance: (userId: string) => Promise<{ masuk: Attendance | null, pulang: Attendance | null }>;
  
  ritasiLogs: Ritasi[];
  addRitasi: (ritasiData: Omit<Ritasi, 'id' | 'timestamp' | 'date'>) => Promise<void>;
  
  jobMixFormulas: JobMixFormula[];
  addJobMixFormula: (jmfData: Omit<JobMixFormula, 'id'>) => Promise<void>;
  updateJobMixFormula: (jmf: JobMixFormula) => Promise<void>;
  deleteJobMixFormula: (jmfId: string) => Promise<void>;

  locations: Location[];
  locationNames: string[];
  addLocation: (location: Omit<Location, 'id'>) => Promise<void>;
  updateLocation: (location: Location) => Promise<void>;
  deleteLocation: (locationId: string) => Promise<void>;
  isDataLoaded: boolean;
};

const AppDataContext = React.createContext<AppDataContextType | null>(null);

// Helper to get data from localStorage
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') {
        return defaultValue;
    }
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error(`Error reading from localStorage key “${key}”:`, error);
        return defaultValue;
    }
};

// Helper to set data to localStorage
const setToLocalStorage = <T,>(key: string, value: T) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Error writing to localStorage key “${key}”:`, error);
    }
};


export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [users, setUsers] = useState<User[]>(() => getFromLocalStorage('users', []));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getFromLocalStorage('vehicles', []));
  const [reports, setReports] = useState<Report[]>(() => getFromLocalStorage('reports', []));
  const [locations, setLocations] = useState<Location[]>(() => getFromLocalStorage('locations', []));
  const [complaints, setComplaints] = useState<Complaint[]>(() => getFromLocalStorage('complaints', []));
  const [suggestions, setSuggestions] = useState<Suggestion[]>(() => getFromLocalStorage('suggestions', []));
  const [mechanicTasks, setMechanicTasks] = useState<MechanicTask[]>(() => getFromLocalStorage('mechanicTasks', []));
  const [sparePartLogs, setSparePartLogs] = useState<SparePartLog[]>(() => getFromLocalStorage('sparePartLogs', []));
  const [penalties, setPenalties] = useState<Penalty[]>(() => getFromLocalStorage('penalties', []));
  const [notifications, setNotifications] = useState<Notification[]>(() => getFromLocalStorage('notifications', []));
  const [ritasiLogs, setRitasiLogs] = useState<Ritasi[]>(() => getFromLocalStorage('ritasiLogs', []));
  const [jobMixFormulas, setJobMixFormulas] = useState<JobMixFormula[]>(() => getFromLocalStorage('jobMixFormulas', []));

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const { toast } = useToast();
  const { user: adminUser } = useAdminAuth();
  const { user: operatorUser } = useOperatorAuth();

  const seedInitialData = useCallback(async () => {
    const usersRef = collection(db, 'users');
    const userSnapshot = await getDocs(query(usersRef, limit(1)));
    if (userSnapshot.empty) {
      console.log('Seeding initial users...');
      const initialUsers = [
        { name: 'Super Admin', username: 'superadmin', password: 'superadmin123', role: 'SUPER_ADMIN' as UserRole },
        { name: 'Admin', username: 'admin', password: 'admin', role: 'SUPER_ADMIN' as UserRole },
      ];
      const userBatch = writeBatch(db);
      initialUsers.forEach(user => {
        const newUserRef = doc(usersRef);
        userBatch.set(newUserRef, user);
      });
      await userBatch.commit();
      console.log('Initial users seeded.');
    }

    const locationsRef = collection(db, 'locations');
    const locationSnapshot = await getDocs(query(locationsRef, limit(1)));
    if (locationSnapshot.empty) {
      console.log('Seeding initial locations...');
      const locationBatch = writeBatch(db);
      initialLocations.forEach(loc => {
          const newLocRef = doc(locationsRef);
          locationBatch.set(newLocRef, loc);
      });
      await locationBatch.commit();
      console.log('Initial locations seeded.');
    }
  }, []);

  useEffect(() => {
    seedInitialData();

    const collectionsToWatch = [
      { name: 'users', setter: setUsers, storageKey: 'users' },
      { name: 'vehicles', setter: setVehicles, storageKey: 'vehicles' },
      { name: 'locations', setter: setLocations, storageKey: 'locations' },
      { name: 'reports', setter: setReports, storageKey: 'reports' },
      { name: 'complaints', setter: setComplaints, storageKey: 'complaints' },
      { name: 'suggestions', setter: setSuggestions, storageKey: 'suggestions' },
      { name: 'mechanicTasks', setter: setMechanicTasks, storageKey: 'mechanicTasks' },
      { name: 'sparePartLogs', setter: setSparePartLogs, storageKey: 'sparePartLogs' },
      { name: 'penalties', setter: setPenalties, storageKey: 'penalties' },
      { name: 'notifications', setter: setNotifications, storageKey: 'notifications' },
      { name: 'ritasi', setter: setRitasiLogs, storageKey: 'ritasiLogs' },
      { name: 'jobMixFormulas', setter: setJobMixFormulas, storageKey: 'jobMixFormulas' },
    ];
    
    const unsubscribes: (() => void)[] = [];

    const handleSnapshot = (
        querySnapshot: any, 
        setter: React.Dispatch<React.SetStateAction<any[]>>, 
        storageKey: string,
        orderByField?: string
    ) => {
        const data = querySnapshot.docs.map((doc: any) => {
            const docData = doc.data();
            Object.keys(docData).forEach(key => {
                if (docData[key] instanceof Timestamp) {
                    docData[key] = docData[key].toMillis();
                }
            });
            return { id: doc.id, ...docData };
        });

        if (orderByField) {
             data.sort((a: any, b: any) => (b[orderByField] || 0) - (a[orderByField] || 0));
        }

        setter(data);
        setToLocalStorage(storageKey, data);
    };

    collectionsToWatch.forEach(({ name, setter, storageKey }) => {
      const q = query(collection(db, name));
      const unsubscribe = onSnapshot(q, (snapshot) => handleSnapshot(snapshot, setter, storageKey, 'timestamp'), (error) => {
        console.error(`Error fetching ${name}: `, error);
        toast({
            variant: "destructive",
            title: `Gagal Memuat Data`,
            description: `Tidak dapat mengambil data untuk "${name}". Menampilkan data dari cache lokal.`,
        });
      });
      unsubscribes.push(unsubscribe);
    });
    
    setIsDataLoaded(true);

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedInitialData]);


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
  
  const submitReport = async (
    newReportData: Omit<Report, 'id' | 'timestamp' | 'reportDate'>,
    submittedBy: 'operator' | 'mechanic',
    repairerName?: string
  ): Promise<void> => {
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
  
    const reportRef = doc(collection(db, 'reports'));
    batch.set(reportRef, reportWithTimestamp);
  
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where("vehicleId", "==", newReportData.vehicleId), orderBy("timestamp", "desc"), limit(1));
    const querySnapshot = await getDocs(q);
    const latestPreviousReportDoc = querySnapshot.docs[0];
  
    let statusBeforeSubmission: Report['overallStatus'] | 'Belum Checklist' = 'Belum Checklist';
    if (latestPreviousReportDoc) {
      const latestReportData = latestPreviousReportDoc.data() as Report;
      const reportTimestamp = (latestReportData.timestamp as unknown as Timestamp).toMillis();
      const reportDate = new Date(reportTimestamp);
  
      if (isSameDay(reportDate, startOfToday())) {
        statusBeforeSubmission = latestReportData.overallStatus;
      } else if (isBefore(reportDate, startOfToday())) {
        if (latestReportData.overallStatus === 'Rusak' || latestReportData.overallStatus === 'Perlu Perhatian') {
          statusBeforeSubmission = latestReportData.overallStatus;
        }
      }
    }
  
    const wasPreviouslyDamaged = statusBeforeSubmission === 'Rusak' || statusBeforeSubmission === 'Perlu Perhatian';
    const isNowBaik = newReportData.overallStatus === 'Baik';
    const isNowDamaged = newReportData.overallStatus === 'Rusak' || newReportData.overallStatus === 'Perlu Perhatian';
  
    const shouldSendNotification = isNowDamaged || (isNowBaik && wasPreviouslyDamaged);
  
    if (shouldSendNotification) {
        const adminRoles: UserRole[] = ['SUPER_ADMIN', 'LOCATION_ADMIN', 'MEKANIK', 'LOGISTIK'];
        const usersToNotifyQuery = users.filter(u => 
            adminRoles.includes(u.role) && 
            (u.role === 'SUPER_ADMIN' || u.location === newReportData.location)
        );
        
        const operatorUser = users.find(u => u.batangan?.includes(vehicle?.licensePlate) && (u.role === 'OPERATOR' || u.role === 'KEPALA_BP'));
        
        const allUsersToNotify = [...usersToNotifyQuery];
        if (operatorUser && !allUsersToNotify.find(u => u.id === operatorUser.id)) {
            allUsersToNotify.push(operatorUser);
        }

        let title = 'Laporan Baru';
        let message = `Laporan baru untuk kendaraan ${vehicle.licensePlate} dari ${newReportData.operatorName}.`;
        let type: NotificationType = 'INFO';

        if (isNowDamaged) {
            title = `Laporan Kerusakan Baru`;
            message = `Kendaraan ${vehicle.licensePlate} (${vehicle.hullNumber}) dilaporkan ${newReportData.overallStatus.toLowerCase()} oleh ${newReportData.operatorName}.`;
            type = 'DAMAGE';
        } else if (isNowBaik && wasPreviouslyDamaged) {
            type = 'SUCCESS';
            title = 'Perbaikan Selesai';
             if (submittedBy === 'mechanic') {
                message = `Kendaraan ${vehicle.licensePlate} (${vehicle.hullNumber}) telah selesai perbaikan, dikerjakan dan dilaporkan oleh mekanik ${newReportData.operatorName.replace('Mekanik: ','')}.`;
            } else {
                message = `Kendaraan ${vehicle.licensePlate} (${vehicle.hullNumber}) dilaporkan telah selesai perbaikan kondisi baik, dikerjakan oleh ${repairerName || 'Tim Mekanik'} dan dilaporkan oleh operator ${newReportData.operatorName}.`;
            }
        }

        for (const userToNotify of allUsersToNotify) {
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

      await updateDoc(doc(db, 'mechanicTasks', taskId), updatePayload);
      toast({ title: "Sukses", description: "Status pekerjaan berhasil diperbarui." });

      if (updates.status === 'COMPLETED') {
        const vehicleInTask = taskBeingUpdated.vehicle;
        const vehicleDetails = vehicles.find(v => v.hullNumber === vehicleInTask.hullNumber);

        if (vehicleInTask && vehicleDetails) {
            const mechanicNames = taskBeingUpdated.mechanics.map(m => m.name).join(', ');
            const reportData = {
              vehicleId: vehicleDetails.hullNumber,
              vehicleType: vehicleDetails.type,
              operatorName: `Mekanik: ${mechanicNames}`,
              location: vehicleDetails.location,
              overallStatus: 'Baik' as const,
              items: [],
              kerusakanLain: { keterangan: `Perbaikan selesai: ${vehicleInTask.repairDescription}.` },
            };
            
            await submitReport(reportData, 'mechanic');
            toast({ title: "Status Kendaraan Diperbarui", description: `Kendaraan ${vehicleDetails.licensePlate} telah ditandai 'Baik'.` });
        }
      }

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

        const penaltyRef = doc(collection(db, 'penalties'));
        batch.set(penaltyRef, { 
            ...penaltyToAdd,
            timestamp: serverTimestamp(),
            givenByAdminUsername: penaltyGiver
        });

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
  
  const addAttendance = async (attendanceData: Omit<Attendance, 'id' | 'timestamp' | 'date'>) => {
    try {
      const now = new Date();
      await addDoc(collection(db, 'attendances'), {
        ...attendanceData,
        timestamp: now.getTime(),
        date: format(now, 'yyyy-MM-dd'),
      });
    } catch(e) {
      console.error("Error adding attendance: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan data absensi." });
      throw e;
    }
  };

  const getTodayAttendance = async (userId: string): Promise<{ masuk: Attendance | null, pulang: Attendance | null }> => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'attendances'), 
      where('userId', '==', userId),
      where('date', '==', todayStr)
    );
    
    const querySnapshot = await getDocs(q);
    const result: { masuk: Attendance | null, pulang: Attendance | null } = { masuk: null, pulang: null };
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Attendance;
      if (data.type === 'masuk') {
        result.masuk = data;
      } else if (data.type === 'pulang') {
        result.pulang = data;
      }
    });

    return result;
  };
  
  const addRitasi = async (ritasiData: Omit<Ritasi, 'id' | 'timestamp' | 'date'>) => {
    try {
      const now = new Date();
      await addDoc(collection(db, 'ritasi'), {
        ...ritasiData,
        timestamp: now.getTime(),
        date: format(now, 'yyyy-MM-dd'),
      });
    } catch(e) {
      console.error("Error adding ritasi: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan data ritasi." });
      throw e;
    }
  };

  const addJobMixFormula = async (jmfData: Omit<JobMixFormula, 'id'>) => {
    try {
      await addDoc(collection(db, 'jobMixFormulas'), jmfData);
      toast({ title: "Sukses", description: "Job Mix Formula berhasil disimpan." });
    } catch (e) {
      console.error("Error adding JMF: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menyimpan JMF." });
    }
  };

  const updateJobMixFormula = async (jmf: JobMixFormula) => {
    const { id, ...jmfData } = jmf;
    try {
      await updateDoc(doc(db, 'jobMixFormulas', id), jmfData);
      toast({ title: "Sukses", description: "Job Mix Formula berhasil diperbarui." });
    } catch (e) {
      console.error("Error updating JMF: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui JMF." });
    }
  };

  const deleteJobMixFormula = async (jmfId: string) => {
    try {
      await deleteDoc(doc(db, 'jobMixFormulas', jmfId));
      toast({ title: "Sukses", description: "Job Mix Formula berhasil dihapus." });
    } catch (e) {
      console.error("Error deleting JMF: ", e);
      toast({ variant: "destructive", title: "Error", description: "Gagal menghapus JMF." });
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
    addAttendance,
    getTodayAttendance,
    ritasiLogs,
    addRitasi,
    jobMixFormulas, addJobMixFormula, updateJobMixFormula, deleteJobMixFormula,
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
