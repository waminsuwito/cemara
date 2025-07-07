
import type { z } from "zod";

export type UserRole = 'SUPER_ADMIN' | 'LOCATION_ADMIN' | 'OPERATOR' | 'MEKANIK' | 'KEPALA_BP' | 'LOGISTIK';

export type User = {
  id: string;
  name: string;
  password?: string;
  role: UserRole;
  nik?: string; // For Operator & Mekanik
  batangan?: string; // For Operator
  location?: string;
  username?: string; // For Admin, Mekanik, Logistik
};

export type Vehicle = {
  id: string;
  hullNumber: string;
  licensePlate: string;
  type: string;
  operator: string;
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
    targetDate: string; // YYYY-MM-DD
    targetTime: string; // HH:mm
  };
  mechanics: {
    id: string;
    name: string;
  }[];
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  delayReason?: string;
};


export const roles: UserRole[] = ["OPERATOR", "MEKANIK", "KEPALA_BP", "LOGISTIK", "LOCATION_ADMIN", "SUPER_ADMIN"];

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
