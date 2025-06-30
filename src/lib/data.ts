
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

export const locations: string[] = ["BP Pekanbaru", "BP Baung", "BP Dumai", "BP IKN"];
export const roles: UserRole[] = ["OPERATOR", "LOCATION_ADMIN", "SUPER_ADMIN"];

export const initialUsers: User[] = [
    // Admins
    { id: 101, name: "Super Admin", username: "superadmin", password: "1", role: "SUPER_ADMIN" },
    { id: 102, name: "Admin Pekanbaru", username: "admin_pku", password: "1", role: "LOCATION_ADMIN", location: "BP Pekanbaru" },
    { id: 103, name: "Admin Baung", username: "admin_baung", password: "1", role: "LOCATION_ADMIN", location: "BP Baung" },
    { id: 104, name: "Admin Dumai", username: "admin_dumai", password: "1", role: "LOCATION_ADMIN", location: "BP Dumai" },
    { id: 105, name: "Admin IKN", username: "admin_ikn", password: "1", role: "LOCATION_ADMIN", location: "BP IKN" },
    
    // Operators
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


export const recentReports = [
  {
    operator: "Umar Santoso",
    vehicleId: "EX-01",
    vehicle: "Exavator EX-01",
    location: locations[0],
    status: "Perlu Perhatian",
    date: "2024-05-20",
  },
  {
    operator: "Aep Saefudin",
    vehicleId: "DT-01",
    vehicle: "Dump Truck DT-01",
    location: locations[1],
    status: "Baik",
    date: "2024-05-20",
  },
  {
    operator: "Amirul",
    vehicleId: "CP-01",
    vehicle: "CP CP-01",
    location: locations[2],
    status: "Rusak",
    date: "2024-05-19",
  },
  {
    operator: "Solihin",
    vehicleId: "TM-01",
    vehicle: "Truck mixer TM-01",
    location: locations[3],
    status: "Baik",
    date: "2024-05-19",
  },
  {
    operator: "Siswanto",
    vehicleId: "FK-01",
    vehicle: "Foco kren FK-01",
    location: locations[0],
    status: "Baik",
    date: "2024-05-18",
  },
];

export const allVehicles: {id: string; type: string; operator: string; location: string; status: string}[] = [
  // Rusak (2)
  { id: "CP-01", type: "CP", operator: "Amirul", location: locations[2], status: "Rusak" },
  { id: "GS-01", type: "Genset", operator: "Budi", location: locations[1], status: "Rusak" },

  // Perlu Perhatian (2)
  { id: "EX-01", type: "Exavator", operator: "Umar Santoso", location: locations[0], status: "Perlu Perhatian" },
  { id: "TM-01", type: "Truck mixer", operator: "Solihin", location: locations[3], status: "Perlu Perhatian" },
  
  // Baik (6)
  { id: "DT-01", type: "Dump Truck", operator: "Aep Saefudin", location: locations[1], status: "Baik" },
  { id: "FK-01", type: "Foco kren", operator: "Siswanto", location: locations[0], status: "Baik" },
  { id: "BP-01", type: "BP", operator: "Charlie", location: locations[2], status: "Baik" },
  { id: "KI-01", type: "Kendaraan Inventaris", operator: "Dedi", location: locations[3], status: "Baik" },
  { id: "KT-01", type: "Kapsul Semen", operator: "Eko", location: locations[0], status: "Baik" },
  { id: "LD-01", type: "Loader", operator: "Kiki", location: locations[2], status: "Baik" },

  // Dummy Baik (62)
  ...Array.from({ length: 62 }, (_, i) => ({
    id: `BAIK-${String(i + 1).padStart(3, '0')}`,
    type: "Various",
    status: "Baik",
    location: locations[i % locations.length],
    operator: `Operator ${i+1}`
  }))
].sort((a, b) => a.id.localeCompare(b.id));

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
