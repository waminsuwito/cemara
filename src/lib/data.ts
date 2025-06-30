
import type { z } from "zod";

export type UserRole = 'SUPER_ADMIN' | 'LOCATION_ADMIN' | 'OPERATOR';

export type User = {
  id: number;
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
  id: number;
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
    items: ReportItem[];
    kerusakanLain?: {
        keterangan: string;
        foto?: string;
    };
    overallStatus: 'Baik' | 'Rusak' | 'Perlu Perhatian';
};


export const locations: string[] = ["BP Pekanbaru", "BP Baung", "BP Dumai", "BP IKN"];
export const roles: UserRole[] = ["OPERATOR", "LOCATION_ADMIN", "SUPER_ADMIN"];

export const initialUsers: User[] = [
    // Admins
    { id: 101, name: "Super Admin", username: "superadmin", password: "1", role: "SUPER_ADMIN" },
    { id: 102, name: "Admin Pekanbaru", username: "admin_pku", password: "1", role: "LOCATION_ADMIN", location: "BP Pekanbaru" },
    { id: 103, name: "Admin Baung", username: "admin_baung", password: "1", role: "LOCATION_ADMIN", location: "BP Baung" },
    { id: 104, name: "Admin Dumai", username: "admin_dumai", password: "1", role: "LOCATION_ADMIN", location: "BP Dumai" },
    { id: 105, name: "Admin IKN", username: "admin_ikn", password: "1", role: "LOCATION_ADMIN", location: "BP IKN" },
    
    // Operators - Make sure each operator is linked to a vehicle by name
    { id: 1, name: "Umar Santoso", nik: "1001", password: "password", batangan: "EX-01", location: "BP Pekanbaru", role: "OPERATOR" },
    { id: 2, name: "Aep Saefudin", nik: "1002", password: "password", batangan: "DT-01", location: "BP Baung", role: "OPERATOR" },
    { id: 3, name: "Amirul", nik: "1003", password: "password", batangan: "CP-01", location: "BP Dumai", role: "OPERATOR" },
    { id: 4, name: "Solihin", nik: "1004", password: "password", batangan: "TM-01", location: "BP IKN", role: "OPERATOR" },
    { id: 5, name: "Siswanto", nik: "1005", password: "password", batangan: "FK-01", location: "BP Pekanbaru", role: "OPERATOR" },
    { id: 6, name: "Budi", nik: "1006", password: "password", batangan: "GS-01", location: "BP Baung", role: "OPERATOR" },
    { id: 7, name: "Charlie", nik: "1007", password: "password", batangan: "BP-01", location: "BP Dumai", role: "OPERATOR" },
    { id: 8, name: "Dedi", nik: "1008", password: "password", batangan: "KI-01", location: "BP IKN", role: "OPERATOR" },
    { id: 9, name: "Eko", nik: "1009", password: "password", batangan: "KT-01", location: "BP Pekanbaru", role: "OPERATOR" },
    { id: 10, name: "Kiki", nik: "1010", password: "password", batangan: "LD-01", location: "BP Dumai", role: "OPERATOR" },
];


export const initialVehicles: Vehicle[] = [
  { id: 1, hullNumber: "TM-01", licensePlate: "B 1111 TMX", type: "Truck mixer", operator: "Solihin", location: "BP IKN" },
  { id: 2, hullNumber: "DT-01", licensePlate: "B 2222 DTK", type: "Dump Truck", operator: "Aep Saefudin", location: "BP Baung" },
  { id: 3, hullNumber: "CP-01", licensePlate: "B 3333 CPP", type: "CP", operator: "Amirul", location: "BP Dumai" },
  { id: 4, hullNumber: "EX-01", licensePlate: "B 4444 EXV", type: "Exavator", operator: "Umar Santoso", location: "BP Pekanbaru" },
  { id: 5, hullNumber: "FK-01", licensePlate: "B 5555 FKK", type: "Foco kren", operator: "Siswanto", location: "BP Pekanbaru" },
  { id: 6, hullNumber: "GS-01", licensePlate: "B 6666 GST", type: "Genset", operator: "Budi", location: "BP Baung" },
  { id: 7, hullNumber: "BP-01", licensePlate: "B 7777 BPP", type: "BP", operator: "Charlie", location: "BP Dumai" },
  { id: 8, hullNumber: "KI-01", licensePlate: "B 8888 KIV", type: "Kendaraan Inventaris", operator: "Dedi", location: "BP IKN" },
  { id: 9, hullNumber: "KT-01", licensePlate: "B 9999 KTS", type: "Kapsul Semen", operator: "Eko", location: "BP Pekanbaru" },
  { id: 10, hullNumber: "LD-01", licensePlate: "B 1010 LDL", type: "Loader", operator: "Kiki", location: "BP Dumai" },
];

// Pre-populate some reports for demonstration
export const initialReports: Report[] = [
    {
        id: "1716100000000", // Represents May 19, 2024
        vehicleId: "CP-01",
        vehicleType: "CP",
        operatorName: "Amirul",
        location: "BP Dumai",
        timestamp: 1716100000000,
        overallStatus: 'Rusak',
        items: [
            { id: "hydraulic_oil", label: "Level oli hidrolik", status: "RUSAK", keterangan: "Oli hidrolik bocor, level sangat rendah.", foto: "https://placehold.co/400x300.png" },
            { id: "rearview_mirror", label: "Kaca spion", status: "RUSAK", keterangan: "Kaca spion sebelah kanan pecah.", foto: "" }
        ],
        kerusakanLain: {
            keterangan: "Ada suara aneh dari mesin saat idle.",
            foto: "https://placehold.co/400x300.png"
        }
    },
    {
        id: "1716186400000", // Represents May 20, 2024
        vehicleId: "EX-01",
        vehicleType: "Exavator",
        operatorName: "Umar Santoso",
        location: "BP Pekanbaru",
        timestamp: 1716186400000,
        overallStatus: 'Perlu Perhatian',
        items: [
            { id: "tire_pressure", label: "Tekanan angin ban", status: "PERLU PERHATIAN", keterangan: "Ban belakang kiri tekanan kurang, perlu ditambah.", foto: "" }
        ]
    }
];


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

export type ReportDetailItem = {
    item: string;
    status: 'RUSAK' | 'PERLU PERHATIAN';
    keterangan: string;
    foto?: string; // URL to image
};

export type ReportDetail = {
    vehicleId: string;
    date: string;
    items: ReportDetailItem[];
    kerusakanLain?: {
        keterangan: string;
        foto?: string;
    };
};

export const reportDetails: ReportDetail[] = [
    {
        vehicleId: "CP-01", // This one is "Rusak"
        date: "2024-05-19",
        items: [
            { item: "Level oli hidrolik", status: "RUSAK", keterangan: "Oli hidrolik bocor, level sangat rendah.", foto: "https://placehold.co/400x300.png" },
            { item: "Kaca spion", status: "RUSAK", keterangan: "Kaca spion sebelah kanan pecah." }
        ],
        kerusakanLain: {
            keterangan: "Ada suara aneh dari mesin saat idle.",
            foto: "https://placehold.co/400x300.png"
        }
    },
    {
        vehicleId: "EX-01", // This one is "Perlu Perhatian"
        date: "2024-05-20",
        items: [
            { item: "Tekanan angin ban", status: "PERLU PERHATIAN", keterangan: "Ban belakang kiri tekanan kurang, perlu ditambah." }
        ]
    },
    {
        vehicleId: "GS-01", // Also "Rusak"
        date: "2024-05-21",
        items: [],
        kerusakanLain: {
            keterangan: "Genset tidak mau menyala sama sekali. Starter rusak.",
            foto: "https://placehold.co/400x300.png"
        }
    }
];

// This data is now derived dynamically in the dashboard
export const allVehicles: {id: string; type: string; operator: string; location: string; status: string}[] = [];
export const recentReports = [];
