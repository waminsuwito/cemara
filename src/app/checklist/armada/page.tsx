
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { useAppData } from '@/context/app-data-context';
import { type Vehicle, type Report, type User } from '@/lib/data';
import { format, isSameDay, isBefore, startOfToday } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, Truck, ClipboardCheck, ClipboardX, AlertTriangle, Wrench, ChevronLeft, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
};

type VehicleWithStatus = Vehicle & { status: string; latestReport?: Report };

const VehicleDetailContent = ({ vehicles, users, statusFilter, title, description, showPenaltyInput }: {
  vehicles: VehicleWithStatus[];
  users: User[];
  statusFilter?: string;
  title: string;
  description: string;
  showPenaltyInput?: boolean;
}) => {
    const { addPenalty } = useAppData();
    const { user: kepalaBP } = useOperatorAuth();
    const { toast } = useToast();
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithStatus | null>(null);
    
    const [penalties, setPenalties] = useState<Record<string, string>>({});
    const [sendingPenalty, setSendingPenalty] = useState<Record<string, boolean>>({});
    const [sentPenalties, setSentPenalties] = useState<string[]>([]);

    const handlePenaltyChange = (vehicleId: string, value: string) => {
        setPenalties(prev => ({...prev, [vehicleId]: value}));
    };

    const handleSendPenalty = async (vehicleId: string) => {
        if (!kepalaBP) return;
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
                                    <TableHead>Operator</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right w-[200px]">
                                        {showPenaltyInput ? "Penalty" : "Aksi"}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredVehicles.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium">{vehicle.hullNumber}</TableCell>
                                        <TableCell>{vehicle.type}</TableCell>
                                        <TableCell>{vehicle.operator}</TableCell>
                                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {showPenaltyInput ? (
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

export default function ArmadaPage() {
    const { user: kepalaBP } = useOperatorAuth();
    const { vehicles, reports, users, isDataLoaded } = useAppData();
    
    const armadaVehicles = useMemo(() => {
        if (!kepalaBP || !kepalaBP.location || !isDataLoaded) return [];

        const vehiclesInLocation = vehicles.filter(v => v.location === kepalaBP.location);
        const today = startOfToday();

        return vehiclesInLocation.map((vehicle): VehicleWithStatus => {
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
    }, [vehicles, reports, kepalaBP, isDataLoaded]);

    if (!isDataLoaded) {
      return (
        <div className="flex h-full w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    const totalCount = armadaVehicles.length;
    const baikCount = armadaVehicles.filter((v) => v.status === "Baik").length;
    const rusakCount = armadaVehicles.filter((v) => v.status === "Rusak").length;
    const perhatianCount = armadaVehicles.filter((v) => v.status === "Perlu Perhatian").length;
    const notCheckedInCount = armadaVehicles.filter(v => v.status === 'Belum Checklist').length;
    const checkedInCount = totalCount - notCheckedInCount;
    
    const checkedInVehicles = armadaVehicles.filter(v => v.status !== 'Belum Checklist');
    const notCheckedInVehicles = armadaVehicles.filter(v => v.status === 'Belum Checklist');
    const baikVehicles = armadaVehicles.filter(v => v.status === 'Baik');
    const perhatianVehicles = armadaVehicles.filter(v => v.status === 'Perlu Perhatian');
    const rusakVehicles = armadaVehicles.filter(v => v.status === 'Rusak');


    return (
        <div className="flex flex-col gap-4 lg:gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard Armada {kepalaBP?.location}</h2>
                <div className="flex items-center space-x-2">
                    <Button asChild>
                        <Link href={`/checklist/armada/print?cb=${new Date().getTime()}`}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Laporan
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="cursor-pointer">
                            <StatCard title="Total Alat" value={`${totalCount}`} icon={Truck} description="Total alat di lokasi Anda" />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                        <VehicleDetailContent
                            title="Detail Total Alat"
                            description="Berikut adalah daftar semua alat berat yang terdaftar di lokasi Anda."
                            vehicles={armadaVehicles}
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
                            description="Berikut adalah daftar alat berat yang belum melakukan checklist hari ini. Anda dapat memberikan penalty kepada operator."
                            vehicles={notCheckedInVehicles}
                            users={users}
                            showPenaltyInput={true}
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
                    <CardTitle>Daftar Armada Lengkap</CardTitle>
                    <CardDescription>
                        Tabel di bawah ini menunjukkan status terkini dari setiap armada di lokasi Anda.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No. Lambung</TableHead>
                                    <TableHead>Jenis</TableHead>
                                    <TableHead>Operator</TableHead>
                                    <TableHead>Status Hari Ini</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {armadaVehicles.length > 0 ? (
                                    armadaVehicles.map((vehicle) => (
                                        <TableRow key={vehicle.id}>
                                            <TableCell className="font-medium">{vehicle.hullNumber}</TableCell>
                                            <TableCell>{vehicle.type}</TableCell>
                                            <TableCell>{vehicle.operator}</TableCell>
                                            <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Tidak ada kendaraan yang terdaftar di lokasi ini.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
