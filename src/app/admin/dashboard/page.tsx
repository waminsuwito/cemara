
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
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
  Printer,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";
import { cn } from "@/lib/utils";
import { type Report, type Vehicle, type User, type Penalty, type Notification } from "@/lib/data";
import { format, isSameDay, isBefore, startOfToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";


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

type VehicleWithStatus = Vehicle & { status: string; latestReport?: Report };

const VehicleDetailContent = ({ vehicles, users, statusFilter, title, description }: {
  vehicles: VehicleWithStatus[];
  users: User[];
  statusFilter?: string;
  title: string;
  description: string;
}) => {
    const { addPenalty } = useAppData();
    const { user: adminUser } = useAdminAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);
    
    // Penalty related state
    const [penalties, setPenalties] = useState<Record<string, string>>({});
    const [sendingPenalty, setSendingPenalty] = useState<Record<string, boolean>>({});
    const [sentPenalties, setSentPenalties] = useState<string[]>([]);

    const handlePenaltyChange = (vehicleId: string, value: string) => {
        setPenalties(prev => ({...prev, [vehicleId]: value}));
    };

    const handleSendPenalty = async (vehicleId: string) => {
        if (!adminUser) return;
        setSendingPenalty(prev => ({ ...prev, [vehicleId]: true }));
        
        const pointsStr = penalties[vehicleId];
        const points = parseInt(pointsStr, 10);
        
        if (isNaN(points) || points <= 0 || points > 10) {
            toast({ title: "Penalty Tidak Valid", description: "Nilai penalty harus angka antara 1 dan 10.", variant: 'destructive' });
            setSendingPenalty(prev => ({ ...prev, [vehicleId]: false }));
            return;
        }

        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;
        
        const responsibleUser = users.find(u => u.name === vehicle.operator && (u.role === 'OPERATOR' || u.role === 'KEPALA_BP'));
        if (!responsibleUser || !responsibleUser.nik) {
            toast({ title: "Pengguna Tidak Ditemukan", description: `Tidak dapat menemukan pengguna yang bertanggung jawab untuk ${vehicle.operator}`, variant: 'destructive' });
            setSendingPenalty(prev => ({ ...prev, [vehicleId]: false }));
            return;
        }

        const penaltyData = {
            userId: responsibleUser.id,
            userName: responsibleUser.name,
            userNik: responsibleUser.nik,
            vehicleHullNumber: vehicle.hullNumber,
            points,
            reason: 'Belum Checklist Harian',
        };

        await addPenalty(penaltyData);
        
        setSendingPenalty(prev => ({ ...prev, [vehicleId]: false }));
        setSentPenalties(prev => [...prev, vehicleId]); 
        setPenalties(prev => {
            const newPenalties = { ...prev };
            delete newPenalties[vehicleId];
            return newPenalties;
        });
    };

    const handleDetailClick = (vehicle: VehicleWithStatus) => {
        setSelectedVehicle(vehicle);
        setView('detail');
    };

    const handleBackClick = () => {
        setSelectedVehicle(null);
        setView('list');
    };

    const report = selectedVehicle?.latestReport;
    const filteredVehicles = statusFilter ? vehicles.filter(v => v.status === statusFilter) : vehicles;
    
    return (
        <>
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
                                    <TableHead className="text-right w-[200px]">
                                        {title === "Detail Alat Belum Checklist" ? "Penalty" : "Aksi"}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium">{vehicle.hullNumber}</TableCell>
                                        <TableCell>{vehicle.type}</TableCell>
                                        <TableCell>{vehicle.location}</TableCell>
                                        <TableCell>{vehicle.operator}</TableCell>
                                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {title === "Detail Alat Belum Checklist" ? (
                                                sentPenalties.includes(vehicle.id) ? (
                                                    <div className="flex items-center justify-end text-green-500 gap-2">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        <span>Terkirim</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max="10"
                                                            className="w-20 h-9 text-center"
                                                            placeholder="Penalty"
                                                            value={penalties[vehicle.id] ?? ''}
                                                            onChange={(e) => handlePenaltyChange(vehicle.id, e.target.value)}
                                                            disabled={sendingPenalty[vehicle.id]}
                                                        />
                                                        <Button 
                                                            size="sm" 
                                                            onClick={() => handleSendPenalty(vehicle.id)}
                                                            disabled={!penalties[vehicle.id] || sendingPenalty[vehicle.id]}
                                                        >
                                                            {sendingPenalty[vehicle.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kirim'}
                                                        </Button>
                                                    </div>
                                                )
                                            ) : (
                                                vehicle.latestReport && (vehicle.status === 'Rusak' || vehicle.status === 'Perlu Perhatian') && (
                                                    <Button variant="outline" size="sm" onClick={() => handleDetailClick(vehicle)}>
                                                        Detail
                                                    </Button>
                                                )
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <DialogFooter className="mt-4">
                        <DialogClose asChild>
                            <Button variant="outline">Tutup</Button>
                        </DialogClose>
                    </DialogFooter>
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
                                <DialogTitle>Detail Laporan Kerusakan: {selectedVehicle?.hullNumber}</DialogTitle>
                                <DialogDescription>Laporan dikirim pada tanggal {report ? format(new Date(report.timestamp), 'dd MMMM yyyy, HH:mm') : '-'}.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
                        {!report ? (
                             <div className="py-4 text-center text-muted-foreground">Tidak ada detail laporan kerusakan untuk kendaraan ini.</div>
                        ): (
                            <>
                            {report.items && report.items.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Item Checklist</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {report.items.map((item, index) => (
                                            <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                                                <p className="font-semibold">{item.label}</p>
                                                <p><span className={`font-medium ${item.status === 'RUSAK' ? 'text-destructive' : 'text-accent'}`}>{item.status}</span>: {item.keterangan}</p>
                                                {item.foto && (
                                                    <div className="mt-2">
                                                        <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                                        <a href={item.foto} target="_blank" rel="noopener noreferrer">
                                                            <img src={item.foto} alt={`Foto ${item.label}`} className="rounded-md w-full max-w-xs cursor-pointer hover:opacity-90 transition-opacity" data-ai-hint="machine damage" />
                                                        </a>
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
                                    </CardHeader>
                                    <CardContent>
                                        <p>{report.kerusakanLain.keterangan}</p>
                                         {report.kerusakanLain.foto && (
                                            <div className="mt-2">
                                                <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                                <a href={report.kerusakanLain.foto} target="_blank" rel="noopener noreferrer">
                                                    <img src={report.kerusakanLain.foto} alt="Foto Kerusakan Lainnya" className="rounded-md w-full max-w-xs cursor-pointer hover:opacity-90 transition-opacity" data-ai-hint="machine part" />
                                                </a>
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
        </>
    );
};


export default function DashboardPage() {
  const { user } = useAdminAuth();
  const { vehicles, reports, users, locationNames, isDataLoaded, notifications } = useAppData();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const prevNotificationsRef = useRef<Notification[]>([]);
  const damageAudioRef = useRef<HTMLAudioElement | null>(null);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Lazy initialization of Audio objects to avoid creating them on the server
    if (typeof window !== 'undefined') {
      if (damageAudioRef.current === null) {
        damageAudioRef.current = new Audio('https://www.myinstants.com/media/sounds/tornado-siren-ii.mp3');
        damageAudioRef.current.volume = 1.0;
      }
      if (successAudioRef.current === null) {
        successAudioRef.current = new Audio('https://www.myinstants.com/media/sounds/success-fanfare-trumpets.mp3');
        successAudioRef.current.volume = 1.0;
      }
    }

    // This logic ensures sounds only play for new notifications for the current admin.
    if (isDataLoaded && notifications.length > prevNotificationsRef.current.length && user) {
        const prevNotificationIds = new Set(prevNotificationsRef.current.map(n => n.id));
        const newNotifications = notifications.filter(n => !prevNotificationIds.has(n.id));

        // Find the full user object for the currently logged-in admin
        const me = users.find(u => u.username === user.username && u.role === user.role);
        if (!me) return;

        // Filter for new notifications intended for this user
        const myNewNotifications = newNotifications.filter(n => n.userId === me.id);
        
        const hasNewDamageNotification = myNewNotifications.some(n => n.type === 'DAMAGE');
        const hasNewSuccessNotification = myNewNotifications.some(n => n.type === 'SUCCESS');

        if (hasNewDamageNotification) {
            damageAudioRef.current?.play().catch(error => {
              console.warn("Audio play failed. This can happen if the user hasn't interacted with the page yet.", error);
            });
        } else if (hasNewSuccessNotification) {
            successAudioRef.current?.play().catch(error => {
              console.warn("Audio play failed. This can happen if the user hasn't interacted with the page yet.", error);
            });
        }
    }

    prevNotificationsRef.current = notifications;

  }, [notifications, isDataLoaded, user, users]);


  const [selectedLocation, setSelectedLocation] = useState(
    isSuperAdmin ? "all" : user?.location || "all"
  );
  
  const vehiclesWithStatus = useMemo(() => {
    const today = startOfToday();
    return vehicles.map((vehicle): VehicleWithStatus => {
      const reportsForVehicle = reports
        .filter(r => r.vehicleId === vehicle.hullNumber)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      const latestReport = reportsForVehicle[0];
      let status = 'Belum Checklist';

      if (latestReport) {
        const reportDate = new Date(latestReport.timestamp);
        if (isSameDay(reportDate, today)) {
          status = latestReport.overallStatus;
        } else if (isBefore(reportDate, today)) {
          if (latestReport.overallStatus === 'Rusak' || latestReport.overallStatus === 'Perlu Perhatian') {
            status = latestReport.overallStatus;
          }
        }
      }
      
      return { ...vehicle, status, latestReport };
    });
  }, [vehicles, reports]);

  const masterVehiclesForLocation = selectedLocation === "all"
    ? vehiclesWithStatus
    : vehiclesWithStatus.filter(v => v.location === selectedLocation);

  const recentReportsForLocation = useMemo(() => {
      const today = new Date();
      return reports.filter(r => 
          (selectedLocation === "all" || r.location === selectedLocation) && isSameDay(new Date(r.timestamp), today)
      ).sort((a, b) => b.timestamp - a.timestamp);
  }, [reports, selectedLocation]);

  const totalCount = masterVehiclesForLocation.length;
  const baikCount = masterVehiclesForLocation.filter((v) => v.status === "Baik").length;
  const rusakCount = masterVehiclesForLocation.filter((v) => v.status === "Rusak").length;
  const perhatianCount = masterVehiclesForLocation.filter((v) => v.status === "Perlu Perhatian").length;
  const notCheckedInCount = totalCount - baikCount - rusakCount - perhatianCount;
  const checkedInCount = totalCount - notCheckedInCount;

  const checkedInVehicles = masterVehiclesForLocation.filter(v => v.status !== 'Belum Checklist');
  const notCheckedInVehicles = masterVehiclesForLocation.filter(v => v.status === 'Belum Checklist');
  const baikVehicles = masterVehiclesForLocation.filter(v => v.status === 'Baik');
  const perhatianVehicles = masterVehiclesForLocation.filter(v => v.status === 'Perlu Perhatian');
  const rusakVehicles = masterVehiclesForLocation.filter(v => v.status === 'Rusak');

  return (
    <>
      <div className="flex flex-col gap-4 lg:gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard Admin</h2>
          <div className="flex items-center space-x-2">
            <Button asChild>
                <Link href={`/admin/dashboard/print?location=${selectedLocation}&cb=${new Date().getTime()}`}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Laporan
                </Link>
            </Button>
            
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!isSuperAdmin}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Semua Lokasi BP" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi BP</SelectItem>
                {locationNames.map(loc => (
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
                    <VehicleDetailContent
                        title="Detail Total Alat"
                        description="Berikut adalah daftar semua alat berat yang terdaftar di lokasi yang dipilih."
                        vehicles={masterVehiclesForLocation}
                        users={users}
                    />
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer">
                        <StatCard title="Alat Sudah Checklist" value={`${checkedInCount}`} icon={ClipboardCheck} description="Alat yang sudah dicek hari ini" />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                    <VehicleDetailContent
                        title="Detail Alat Sudah Checklist"
                        description="Berikut adalah daftar alat berat yang sudah melakukan checklist hari ini."
                        vehicles={checkedInVehicles}
                        users={users}
                    />
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer">
                        <StatCard title="Alat Belum Checklist" value={`${notCheckedInCount}`} icon={ClipboardX} description="Alat yang belum dicek hari ini" />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                    <VehicleDetailContent
                        title="Detail Alat Belum Checklist"
                        description="Berikut adalah daftar alat berat yang belum melakukan checklist hari ini."
                        vehicles={notCheckedInVehicles}
                        users={users}
                    />
                </DialogContent>
            </Dialog>

            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer">
                        <StatCard title="Alat Baik" value={`${baikCount}`} icon={CheckCircle2} description="Total alat kondisi baik" />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                    <VehicleDetailContent
                        title="Detail Alat Baik"
                        description="Berikut adalah daftar semua alat berat dalam kondisi baik."
                        vehicles={baikVehicles}
                        users={users}
                        statusFilter="Baik"
                    />
                </DialogContent>
            </Dialog>
            
            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer">
                        <StatCard title="Perlu Perhatian" value={`${perhatianCount}`} icon={AlertTriangle} description="Total alat perlu perhatian" valueClassName="text-accent" />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                    <VehicleDetailContent
                        title="Detail Alat Perlu Perhatian"
                        description="Berikut adalah daftar semua alat berat yang memerlukan perhatian."
                        vehicles={perhatianVehicles}
                        users={users}
                        statusFilter="Perlu Perhatian"
                    />
                </DialogContent>
            </Dialog>
            
            <Dialog>
                <DialogTrigger asChild>
                    <div className="cursor-pointer">
                        <StatCard title="Alat Rusak" value={`${rusakCount}`} icon={Wrench} description="Total alat kondisi rusak" valueClassName="text-destructive" />
                    </div>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                    <VehicleDetailContent
                        title="Detail Alat Rusak"
                        description="Berikut adalah daftar semua alat berat yang rusak."
                        vehicles={rusakVehicles}
                        users={users}
                        statusFilter="Rusak"
                    />
                </DialogContent>
            </Dialog>
        </div>

        <Card>
            <CardHeader>
            <CardTitle>Laporan Terbaru Hari Ini</CardTitle>
            <CardDescription>
                Checklist yang baru saja dikirim oleh operator di lokasi yang dipilih hari ini.
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
                    <TableHead>Waktu Lapor</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {recentReportsForLocation.length > 0 ? recentReportsForLocation.map((report) => (
                    <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.operatorName}</TableCell>
                    <TableCell>{report.vehicleType} {report.vehicleId}</TableCell>
                    <TableCell>{report.location}</TableCell>
                    <TableCell>{getStatusBadge(report.overallStatus)}</TableCell>
                    <TableCell>{format(new Date(report.timestamp), 'HH:mm:ss')}</TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            Belum ada laporan hari ini.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
