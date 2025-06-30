
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
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Truck,
  Wrench,
  ClipboardCheck,
  ClipboardX,
  ChevronLeft,
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
import { locations, recentReports, allVehicles, reportDetails, type ReportDetail } from "@/lib/data";


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

const VehicleDetailContainer = ({ vehicles, statusFilter, title, description }: { vehicles: typeof allVehicles, statusFilter?: string, title: string, description: string }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const handleDetailClick = (vehicleId: string) => {
        setSelectedVehicleId(vehicleId);
        setView('detail');
    };

    const handleBackClick = () => {
        setSelectedVehicleId(null);
        setView('list');
    };

    const report = selectedVehicleId ? reportDetails.find(r => r.vehicleId === selectedVehicleId) : undefined;
    const filteredVehicles = statusFilter ? vehicles.filter(v => v.status === statusFilter) : vehicles;
    
    return (
        <DialogContent className="sm:max-w-[800px]">
            {view === 'list' ? (
                <>
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>{description}</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID Kendaraan</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Lokasi</TableHead>
                                    <TableHead>Operator</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
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
                                        <TableCell className="text-right">
                                            {(vehicle.status === 'Rusak' || vehicle.status === 'Perlu Perhatian') && reportDetails.some(r => r.vehicleId === vehicle.id) && (
                                                <Button variant="outline" size="sm" onClick={() => handleDetailClick(vehicle.id)}>
                                                    Detail
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </>
            ) : (
                <>
                    <DialogHeader>
                        <div className="flex items-center gap-4">
                             <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleBackClick}>
                                <ChevronLeft className="h-4 w-4" />
                                <span className="sr-only">Kembali</span>
                            </Button>
                            <div>
                                <DialogTitle>Detail Laporan Kerusakan: {selectedVehicleId}</DialogTitle>
                                <DialogDescription>Laporan dikirim pada tanggal {report?.date}.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                        {!report ? (
                             <div className="py-4 text-center text-muted-foreground">Tidak ada detail laporan kerusakan untuk kendaraan ini.</div>
                        ): (
                            <>
                            {report.items.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Item Checklist</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {report.items.map((item, index) => (
                                            <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                <p className="font-semibold">{item.item}</p>
                                                <p><span className={`font-medium ${item.status === 'RUSAK' ? 'text-destructive' : 'text-accent'}`}>{item.status}</span>: {item.keterangan}</p>
                                                {item.foto && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                                        <img src={item.foto} alt={`Foto ${item.item}`} className="rounded-md w-full max-w-xs" data-ai-hint="machine damage" />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                            {report.kerusakanLain && (
                                 <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Kerusakan Lainnya</CardTitle>
                                    </Header>
                                    <CardContent>
                                        <p>{report.kerusakanLain.keterangan}</p>
                                         {report.kerusakanLain.foto && (
                                            <div className="mt-2">
                                                <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                                <img src={report.kerusakanLain.foto} alt="Foto Kerusakan Lainnya" className="rounded-md w-full max-w-xs" data-ai-hint="machine part" />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                            </>
                        )}
                    </div>
                </>
            )}
        </DialogContent>
    );
}

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
            <VehicleDetailContainer
                title="Detail Total Alat"
                description="Berikut adalah daftar semua alat berat yang terdaftar di lokasi yang dipilih."
                vehicles={todayVehicles}
            />
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Sudah Checklist" value={`${checkedInCount}`} icon={ClipboardCheck} description="Alat yang sudah dicek hari ini" />
                </div>
            </DialogTrigger>
            <VehicleDetailContainer
                title="Detail Alat Sudah Checklist"
                description="Berikut adalah daftar alat berat yang sudah melakukan checklist."
                vehicles={checkedInVehicles}
            />
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Belum Checklist" value={`${notCheckedInCount}`} icon={ClipboardX} description="Alat yang belum dicek hari ini" />
                </div>
            </DialogTrigger>
            <VehicleDetailContainer
                title="Detail Alat Belum Checklist"
                description="Berikut adalah daftar alat berat yang belum melakukan checklist."
                vehicles={notCheckedInVehicles}
            />
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Baik" value={`${baikCount}`} icon={CheckCircle2} description="Total alat kondisi baik" />
                </div>
            </DialogTrigger>
            <VehicleDetailContainer
                title="Detail Alat Baik"
                description="Berikut adalah daftar semua alat berat dalam kondisi baik."
                vehicles={todayVehicles}
                statusFilter="Baik"
            />
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Perlu Perhatian" value={`${perhatianCount}`} icon={AlertTriangle} description="Total alat perlu perhatian" valueClassName="text-accent" />
                </div>
            </DialogTrigger>
            <VehicleDetailContainer
                title="Detail Alat Perlu Perhatian"
                description="Berikut adalah daftar semua alat berat yang memerlukan perhatian."
                vehicles={todayVehicles}
                statusFilter="Perlu Perhatian"
            />
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Rusak" value={`${rusakCount}`} icon={Wrench} description="Total alat kondisi rusak" valueClassName="text-destructive" />
                </div>
            </DialogTrigger>
            <VehicleDetailContainer
                title="Detail Alat Rusak"
                description="Berikut adalah daftar semua alat berat yang rusak."
                vehicles={todayVehicles}
                statusFilter="Rusak"
            />
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
