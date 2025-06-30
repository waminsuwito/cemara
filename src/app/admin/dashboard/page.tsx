
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Truck,
  Wrench,
  ClipboardCheck,
  ClipboardX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminAuth } from "@/context/admin-auth-context";
import { cn } from "@/lib/utils";


const locations = ["BP Pekanbaru", "BP Baung", "BP Dumai", "BP IKN"];

const recentReports = [
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

const allVehicles: {id: string; type: string; operator: string; location: string; status: string}[] = [
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

const StatCard = ({ title, value, icon: Icon, description, valueClassName }: { title: string, value: string, icon: React.ElementType, description: string, valueClassName?: string }) => (
    <Card className="hover:bg-muted/50 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", valueClassName)} />
        </CardHeader>
        <CardContent>
            <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Baik":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Baik</Badge>;
    case "Perlu Perhatian":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Perlu Perhatian</Badge>;
    case "Rusak":
      return <Badge variant="destructive">Rusak</Badge>;
    case "Belum Checklist":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Belum Checklist</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

const DetailTable = ({ vehicles, statusFilter }: { vehicles: typeof allVehicles, statusFilter?: string }) => {
  const filteredVehicles = statusFilter ? vehicles.filter(v => v.status === statusFilter) : vehicles;
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Kendaraan</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Operator</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.id}</TableCell>
              <TableCell>{vehicle.type}</TableCell>
              <TableCell>{vehicle.location}</TableCell>
              <TableCell>{vehicle.operator}</TableCell>
              <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
};

export default function DashboardPage() {
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [selectedLocation, setSelectedLocation] = useState(
    isSuperAdmin ? "all" : user?.location || "all"
  );

  const masterVehiclesForLocation = selectedLocation === "all"
    ? allVehicles
    : allVehicles.filter(v => v.location === selectedLocation);

  const filteredRecentReports = selectedLocation === "all"
    ? recentReports
    : recentReports.filter(r => r.location === selectedLocation);

  const reportMap = new Map(filteredRecentReports.map(r => [r.vehicleId, r.status]));

  const todayVehicles = masterVehiclesForLocation.map(vehicle => {
    const todayStatus = reportMap.get(vehicle.id);
    return {
      ...vehicle,
      status: todayStatus || 'Belum Checklist'
    };
  });

  const totalCount = todayVehicles.length;
  const baikCount = todayVehicles.filter((v) => v.status === "Baik").length;
  const rusakCount = todayVehicles.filter((v) => v.status === "Rusak").length;
  const perhatianCount = todayVehicles.filter((v) => v.status === "Perlu Perhatian").length;
  const notCheckedInCount = todayVehicles.filter((v) => v.status === "Belum Checklist").length;
  const checkedInCount = totalCount - notCheckedInCount;

  const checkedInVehicles = todayVehicles.filter(v => v.status !== 'Belum Checklist');
  const notCheckedInVehicles = todayVehicles.filter(v => v.status === 'Belum Checklist');

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard Admin</h2>
        <div className="flex items-center space-x-2">
          <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!isSuperAdmin}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Lokasi BP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi BP</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Total Alat" value={`${totalCount}`} icon={Truck} description="Total alat di lokasi ini" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Total Alat</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat yang terdaftar di lokasi yang dipilih.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={todayVehicles} />
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Sudah Checklist" value={`${checkedInCount}`} icon={ClipboardCheck} description="Alat yang sudah dicek hari ini" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Sudah Checklist</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar alat berat yang sudah melakukan checklist.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={checkedInVehicles} />
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Belum Checklist" value={`${notCheckedInCount}`} icon={ClipboardX} description="Alat yang belum dicek hari ini" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Belum Checklist</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar alat berat yang belum melakukan checklist.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={notCheckedInVehicles} />
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Baik" value={`${baikCount}`} icon={CheckCircle2} description="Total alat kondisi baik" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Baik</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat dalam kondisi baik.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={todayVehicles} statusFilter="Baik" />
            </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Perlu Perhatian" value={`${perhatianCount}`} icon={AlertTriangle} description="Total alat perlu perhatian" valueClassName="text-accent" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Perlu Perhatian</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat yang memerlukan perhatian.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={todayVehicles} statusFilter="Perlu Perhatian" />
            </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Rusak" value={`${rusakCount}`} icon={Wrench} description="Total alat kondisi rusak" valueClassName="text-destructive" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Rusak</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat yang rusak.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={todayVehicles} statusFilter="Rusak" />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Terbaru</CardTitle>
          <CardDescription>
            Checklist yang baru saja dikirim oleh operator di lokasi yang dipilih.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecentReports.map((report, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{report.operator}</TableCell>
                  <TableCell>{report.vehicle}</TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{report.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
