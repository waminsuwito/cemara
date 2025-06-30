
"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Truck,
  Wrench,
  ClipboardCheck,
  ClipboardX,
  ChevronLeft,
  Printer,
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
import { useAppData } from "@/context/app-data-context";
import { cn } from "@/lib/utils";
import { type Report, type Vehicle } from "@/lib/data";
import { format, isSameDay, isBefore, startOfToday } from "date-fns";
import { id as localeID } from "date-fns/locale";


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

const VehicleDetailContent = ({ vehicles, statusFilter, title, description }: {
  vehicles: VehicleWithStatus[];
  statusFilter?: string;
  title: string;
  description: string;
}) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);

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
                                    <TableHead className="text-right">Aksi</TableHead>
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
                                            {vehicle.latestReport && (vehicle.status === 'Rusak' || vehicle.status === 'Perlu Perhatian') && (
                                                <Button variant="outline" size="sm" onClick={() => handleDetailClick(vehicle)}>
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
                                                        <img src={item.foto} alt={`Foto ${item.label}`} className="rounded-md w-full max-w-xs" data-ai-hint="machine damage" />
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
        </>
    );
};

// Printable Report Component
const PrintableDashboard = React.forwardRef<HTMLDivElement, { stats: { label: string, value: number }[], selectedLocation: string }>(({ stats, selectedLocation }, ref) => {
    const locationDisplay = selectedLocation === 'all' ? 'Semua Lokasi' : selectedLocation;
    const printDate = format(new Date(), 'dd MMMM yyyy', { locale: localeID });

    return (
        <div ref={ref} className="p-10 text-black bg-white font-sans">
            <h1 className="text-3xl font-bold mb-2 text-center">PT FARIKA RIAU PERKASA</h1>
            <h2 className="text-xl font-semibold mb-4 text-center">Laporan Harian Kondisi Alat</h2>
            <div className="flex justify-between mb-6">
                <p><span className="font-semibold">Lokasi:</span> {locationDisplay}</p>
                <p><span className="font-semibold">Tanggal:</span> {printDate}</p>
            </div>
            <table className="w-full text-sm border-collapse border border-gray-600">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="border border-gray-600 p-2 text-left">Status Kondisi</th>
                        <th className="border border-gray-600 p-2 text-right">Jumlah Alat</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.map((stat, index) => (
                        <tr key={index} className="even:bg-gray-50">
                            <td className="border border-gray-600 p-2">{stat.label}</td>
                            <td className="border border-gray-600 p-2 text-right">{stat.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="mt-12 text-sm text-gray-500">
                <p>Laporan ini dibuat secara otomatis oleh sistem Checklist Harian Alat.</p>
                <p>Dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm:ss')}</p>
            </div>
        </div>
    );
});
PrintableDashboard.displayName = 'PrintableDashboard';


export default function DashboardPage() {
  const { user } = useAdminAuth();
  const { vehicles, reports, locationNames } = useAppData();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
      content: () => componentRef.current,
      documentTitle: `Laporan-Kondisi-Alat-${format(new Date(), 'yyyy-MM-dd')}`,
      onAfterPrint: () => console.log('print success')
  });

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
  const notCheckedInCount = masterVehiclesForLocation.filter((v) => v.status === "Belum Checklist").length;
  const checkedInCount = totalCount - notCheckedInCount;

  const checkedInVehicles = masterVehiclesForLocation.filter(v => v.status !== 'Belum Checklist');
  const notCheckedInVehicles = masterVehiclesForLocation.filter(v => v.status === 'Belum Checklist');
  const baikVehicles = masterVehiclesForLocation.filter(v => v.status === 'Baik');
  const perhatianVehicles = masterVehiclesForLocation.filter(v => v.status === 'Perlu Perhatian');
  const rusakVehicles = masterVehiclesForLocation.filter(v => v.status === 'Rusak');

  const reportStats = [
      { label: 'Total Alat', value: totalCount },
      { label: 'Alat Sudah Checklist', value: checkedInCount },
      { label: 'Alat Belum Checklist', value: notCheckedInCount },
      { label: 'Kondisi Baik', value: baikCount },
      { label: 'Perlu Perhatian', value: perhatianCount },
      { label: 'Kondisi Rusak', value: rusakCount },
  ];

  return (
    <>
      <div style={{ display: "none" }}>
          <PrintableDashboard ref={componentRef} stats={reportStats} selectedLocation={selectedLocation} />
      </div>

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard Admin</h2>
        <div className="flex items-center space-x-2">
           <button onClick={handlePrint} className={cn(buttonVariants())}>
             <Printer className="mr-2 h-4 w-4" />
             Print Laporan
           </button>
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
    </>
  );
}
