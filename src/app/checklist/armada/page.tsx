
"use client";

import React, { useState, useMemo } from 'react';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { useAppData } from '@/context/app-data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Vehicle, Report } from '@/lib/data';
import { isSameDay, isBefore, startOfToday } from "date-fns";
import { useToast } from '@/hooks/use-toast';

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

export default function ArmadaPage() {
    const { user: kepalaBP, isLoading: authIsLoading } = useOperatorAuth();
    const { vehicles, reports, users, addPenalty, isDataLoaded } = useAppData();
    const { toast } = useToast();

    const [penalties, setPenalties] = useState<Record<string, string>>({});
    const [sendingPenalty, setSendingPenalty] = useState<Record<string, boolean>>({});
    const [sentPenalties, setSentPenalties] = useState<string[]>([]);

    const armadaForLocation = useMemo(() => {
        if (!kepalaBP || !kepalaBP.location) return [];

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
        }).sort((a, b) => a.hullNumber.localeCompare(b.hullNumber));
    }, [kepalaBP, vehicles, reports]);
    
    if (authIsLoading || !isDataLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!kepalaBP || kepalaBP.role !== 'KEPALA_BP') {
        return (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-1 text-center">
                    <ShieldAlert className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-2xl font-bold tracking-tight">Akses Ditolak</h3>
                    <p className="text-sm text-muted-foreground">
                        Hanya Kepala BP yang dapat mengakses halaman ini.
                    </p>
                </div>
            </div>
        );
    }
    
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

        const vehicle = armadaForLocation.find(v => v.id === vehicleId);
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>Daftar Armada di Lokasi Anda</CardTitle>
                <CardDescription>
                    Monitor kondisi semua alat di lokasi {kepalaBP.location} dan berikan penalty jika diperlukan.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No. Lambung</TableHead>
                                <TableHead>Jenis Alat</TableHead>
                                <TableHead>Operator</TableHead>
                                <TableHead>Status Hari Ini</TableHead>
                                <TableHead className="text-right w-[220px]">Aksi / Penalty</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {armadaForLocation.length > 0 ? (
                                armadaForLocation.map((vehicle) => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium">{vehicle.hullNumber}</TableCell>
                                        <TableCell>{vehicle.type}</TableCell>
                                        <TableCell>{vehicle.operator}</TableCell>
                                        <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {vehicle.status === "Belum Checklist" ? (
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
                                                <span className="text-xs text-muted-foreground italic">Tidak ada aksi</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        Tidak ada armada terdaftar di lokasi Anda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
