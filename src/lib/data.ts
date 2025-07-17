
import type { z } from "zod";

export type UserRole = 'SUPER_ADMIN' | 'LOCATION_ADMIN' | 'OPERATOR' | 'MEKANIK' | 'KEPALA_BP' | 'LOGISTIK' | 'Operator BP';

export type User = {
  id: string;
  name: string;
  password?: string;
  role: UserRole;
  nik?: string; // For Operator, Kepala BP & Mekanik
  batangan?: string; // For Operator & Kepala BP
  location?: string;
  username?: string; // For Admin, Mekanik, Logistik
};

export type Vehicle = {
  id: string;
  hullNumber: string;
  licensePlate: string;
  type: string;
  location: string;
};

export type ReportItem = {
    id: string;
    label: string;
    status: 'BAIK' | 'RUSAK' | 'PERLU PERHATIAN';
    keterangan: string;
    foto?: string;
};

export type Report = {
    id: string; // timestamp of submission
    vehicleId: string;
    vehicleType: string;
    operatorName: string;
    location: string;
    timestamp: number;
    reportDate: string; // YYYY-MM-DD
    items: ReportItem[];
    kerusakanLain?: {
        keterangan: string;
        foto?: string;
    };
    overallStatus: 'Baik' | 'Rusak' | 'Perlu Perhatian';
};

export type Location = {
  id: string;
  namaBP: string;
  lokasiBP: string;
};

export type Complaint = {
  id: string;
  timestamp: number;
  operatorName: string;
  vehicleId: string;
  location: string;
  complaint: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
};

export type Suggestion = {
  id: string;
  timestamp: number;
  operatorName: string;
  vehicleId: string;
  location: string;
  suggestion: string;
};

export type MechanicTask = {
  id: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  vehicle: {
    hullNumber: string;
    licensePlate: string;
    repairDescription: string;
    targetDate: string; // YYYY-MM-dd
    targetTime: string; // HH:mm
    triggeringReportId?: string;
  };
  mechanics: {
    id: string;
    name: string;
  }[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  delayReason?: string;
};

export type SparePartLog = {
  id: string;
  taskId: string;
  vehicleHullNumber: string;
  partsUsed: string;
  logDate: number;
  loggedById: string;
  loggedByName: string;
};

export type Penalty = {
  id: string;
  userId: string;
  userName: string;
  userNik: string;
  vehicleHullNumber: string;
  points: number;
  reason: string;
  timestamp: number;
  givenByAdminUsername: string;
};

export type NotificationType = 'DAMAGE' | 'SUCCESS' | 'PENALTY' | 'INFO';

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  type?: NotificationType;
};

export type Attendance = {
    id: string;
    userId: string; // Can be username (for admins) or user.id (for operators)
    userName: string;
    timestamp: number;
    date: string; // YYYY-MM-DD for easy querying
    type: 'masuk' | 'pulang';
    status: 'Tepat Waktu' | 'Terlambat';
    location: string;
    photo: string;
};

export type Ritasi = {
    id: string;
    date: string; // YYYY-MM-DD
    timestamp: number;
    operatorId: string;
    operatorName: string;
    vehicleHullNumber: string;
    asal: string;
    tujuan: string;
    berangkat?: string; // HH:mm:ss
    sampai?: string;
    kembali?: string;
    tiba?: string;
};

export type JobMixFormula = {
    id: string;
    mutu: string;
    pasir1: number;
    pasir2: number;
    batu1: number;
    batu2: number;
    semen1: number;
    semen2: number;
    air: number;
};


export const roles: UserRole[] = ["OPERATOR", "Operator BP", "MEKANIK", "KEPALA_BP", "LOGISTIK", "LOCATION_ADMIN", "SUPER_ADMIN"];

// Checklist for standard vehicles
export const checklistItems = [
  { id: "engine_oil", label: "Level oli mesin" },
  { id: "hydraulic_oil", label: "Level oli hidrolik" },
  { id: "radiator_water", label: "Level air radiator" },
  { id: "battery_water", label: "Level air aki" },
  { id: "brake_fluid", label: "Level minyak rem" },
  { id: "transmission_fluid", label: "Level minyak perseneling" },
  { id: "air_filter", label: "Kebersihan filter udara" },
  { id: "tire_pressure", label: "Tekanan angin ban" },
  { id: "grease_lubrication", label: "Gris dan pelumasan bearing" },
  { id: "cabin_cleanliness", label: "Kebersihan kabin" },
  { id: "bucket_cleanliness", label: "Kebersihan gentong/bak" },
  { id: "rearview_mirror", label: "Kaca spion" },
  { id: "backup_alarm", label: "Alarm mundur" },
];

// List of "Batangan" (Nomor Polisi) codes for Batching Plant equipment
export const batchingPlantBatangan = [
    "BP-KUBANG",
    "BP#1-BAUNG",
    "BP#2-BAUNG",
    "BP#3-BAUNG",
    "BP-DUMAI",
    "BP#1-IKN",
    "BP#2-IKN"
];

// Checklist for Batching Plant equipment
export const batchingPlantChecklistItems = [
    { id: "gearbox_skru_oil", label: "Level oli gearbox skru" },
    { id: "gearbox_konveyor_oil", label: "Level oli gearbox konveyor" },
    { id: "gearbox_mixer_oil", label: "Level oli gearbox mixer" },
    { id: "compressor_oil", label: "Level oli compressor" },
    { id: "hydraulic_mixer_door_oil", label: "Level oli hidraulik pintu mixer" },
    { id: "bearing_condition", label: "Kondisi semua bearing" },
    { id: "roller_condition", label: "Kondisi semua roler" },
    { id: "conveyor_belt_condition", label: "Kondisi semua belt konveyor" },
    { id: "air_cylinder_condition", label: "Kondisi semua silinder angin" },
    { id: "mixer_door", label: "Pintu mixer" },
    { id: "material_bucket_door", label: "Pintu baket material" },
    { id: "other_condition", label: "Kondisi alat lainnya" }
];

export const initialLocations: Omit<Location, "id">[] = [
    { namaBP: "BP PEKANBARU", lokasiBP: "BP PEKANBARU" },
    { namaBP: "BP DUMAI", lokasiBP: "BP DUMAI" },
    { namaBP: "BP BAUNG", lokasiBP: "BP BAUNG" },
    { namaBP: "BP IKN", lokasiBP: "BP IKN" },
];
