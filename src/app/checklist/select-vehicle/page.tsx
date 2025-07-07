
"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { useAppData } from '@/context/app-data-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type Vehicle } from '@/lib/data';
import { isSameDay, isBefore, startOfToday } from "date-fns";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Baik":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Sudah Checklist</Badge>;
    case "Perlu Perhatian":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Perlu Perhatian</Badge>;
    case "Rusak":
      return <Badge variant="destructive">Rusak</Badge>;
    case "Belum Checklist":
       return <Badge variant="outline">Belum Checklist</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function SelectVehiclePage() {
    const router = useRouter();
    const { user, selectVehicle, isLoading: authIsLoading } = useOperatorAuth();
    const { vehicles, reports, isDataLoaded } = useAppData();

    useEffect(() => {
        if (!authIsLoading && !user) {
            router.replace('/');
        }
    }, [user, authIsLoading, router]);

    const availableVehiclesWithStatus = useMemo(() => {
        if (!user || !user.batangan) return [];
        
        const batanganList = user.batangan.split(',').map(b => b.trim().toLowerCase());
        
        const assignedVehicles = vehicles.filter(v => 
            batanganList.includes(v.licensePlate.trim().toLowerCase())
        );

        const today = startOfToday();

        return assignedVehicles.map(vehicle => {
            const reportsForVehicle = reports
                .filter(r => r.vehicleId === vehicle.hullNumber)
                .sort((a, b) => b.timestamp - a.timestamp);
            
            const latestReport = reportsForVehicle[0];
            let status = 'Belum Checklist';
            let damageInfo = '';

            if (latestReport) {
                const reportDate = new Date(latestReport.timestamp);
                if (isSameDay(reportDate, today)) {
                    status = latestReport.overallStatus;
                } else if (isBefore(reportDate, today)) {
                    if (latestReport.overallStatus === 'Rusak' || latestReport.overallStatus === 'Perlu Perhatian') {
                        status = latestReport.overallStatus;
                    }
                }
                
                if (status === 'Rusak' || status === 'Perlu Perhatian') {
                    const problemItems = latestReport.items
                        ?.filter(item => item.status !== 'BAIK')
                        .map(item => item.label)
                        .join(', ');

                    const otherDamage = latestReport.kerusakanLain?.keterangan 
                        ? 'Kerusakan Lainnya' 
                        : '';
                    
                    const fullDamageInfo = [problemItems, otherDamage].filter(Boolean).join('; ');
                    damageInfo = fullDamageInfo.length > 50 ? `${fullDamageInfo.substring(0, 50)}...` : fullDamageInfo;
                }
            }
            
            return { ...vehicle, status, damageInfo };
        });
    }, [user, vehicles, reports]);


    const handleSelectVehicle = (vehicle: Vehicle) => {
        selectVehicle(vehicle.hullNumber);
        router.push('/checklist');
    };

    if (authIsLoading || !isDataLoaded) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
         return null; // The layout will redirect
    }

    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl">Pilih Kendaraan</CardTitle>
                <CardDescription>
                    Anda ditugaskan pada beberapa kendaraan. Pilih kendaraan yang akan Anda operasikan hari ini untuk melanjutkan checklist.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {availableVehiclesWithStatus.length > 0 ? (
                    availableVehiclesWithStatus.map(vehicle => (
                        <Button
                            key={vehicle.id}
                            variant="outline"
                            size="lg"
                            className="h-auto justify-start p-4 text-left"
                            onClick={() => handleSelectVehicle(vehicle)}
                        >
                            <Truck className="mr-4 h-6 w-6 text-primary flex-shrink-0 self-start mt-1" />
                            <div className="flex flex-col w-full min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-bold text-base">{vehicle.licensePlate}</span>
                                    {getStatusBadge(vehicle.status)}
                                </div>
                                <span className="text-sm text-muted-foreground">{vehicle.type} - No. Lambung: {vehicle.hullNumber}</span>
                                 {(vehicle.status === 'Rusak' || vehicle.status === 'Perlu Perhatian') && vehicle.damageInfo && (
                                    <p className="text-xs text-yellow-600 mt-1 truncate">
                                        Ket: {vehicle.damageInfo}
                                    </p>
                                )}
                            </div>
                        </Button>
                    ))
                ) : (
                    <div className="text-center text-muted-foreground py-6">
                        <p>Tidak ada kendaraan yang cocok ditemukan untuk "batangan" yang terdaftar pada profil Anda.</p>
                        <p>Mohon hubungi admin.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
