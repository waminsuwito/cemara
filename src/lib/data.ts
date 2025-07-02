import type { z } from "zod";

export type UserRole = 'SUPER_ADMIN' | 'LOCATION_ADMIN' | 'OPERATOR';

export type User = {
  id: string;
  name: string;
  password?: string;
  role: UserRole;
  // Operator specific
  nik?: string;
  batangan?: string;
  location?: string;
  // Admin specific
  username?: string;
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


export const roles: UserRole[] = ["OPERATOR", "LOCATION_ADMIN", "SUPER_ADMIN"];

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
