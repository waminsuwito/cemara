
"use client";

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { useAppData } from '@/context/app-data-context';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Truck } from 'lucide-react';
import { type Vehicle } from '@/lib/data';

export default function SelectVehiclePage() {
    const router = useRouter();
    const { user, selectVehicle, isLoading: authIsLoading } = useOperatorAuth();
    const { vehicles, isDataLoaded } = useAppData();

    useEffect(() => {
        if (!authIsLoading && !user) {
            router.replace('/');
        }
    }, [user, authIsLoading, router]);

    const availableVehicles = useMemo(() => {
        if (!user || !user.batangan) return [];
        
        const batanganList = user.batangan.split(',').map(b => b.trim().toLowerCase());
        
        return vehicles.filter(v => 
            batanganList.includes(v.licensePlate.trim().toLowerCase())
        );
    }, [user, vehicles]);

    const handleSelectVehicle = (vehicle: Vehicle) => {
        selectVehicle(vehicle.hullNumber);
        router.push('/checklist');
    };

    if (authIsLoading || !isDataLoaded) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
         return null; // or a redirect component
    }

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
                <Card className="w-full max-w-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl">Pilih Kendaraan</CardTitle>
                        <CardDescription>
                            Anda ditugaskan pada beberapa kendaraan. Pilih kendaraan yang akan Anda operasikan hari ini untuk melanjutkan checklist.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {availableVehicles.length > 0 ? (
                            availableVehicles.map(vehicle => (
                                <Button
                                    key={vehicle.id}
                                    variant="outline"
                                    size="lg"
                                    className="h-auto justify-start p-4 text-left"
                                    onClick={() => handleSelectVehicle(vehicle)}
                                >
                                    <Truck className="mr-4 h-6 w-6 text-primary" />
                                    <div className="flex flex-col">
                                        <span className="font-bold text-base">{vehicle.licensePlate}</span>
                                        <span className="text-sm text-muted-foreground">{vehicle.type} - No. Lambung: {vehicle.hullNumber}</span>
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
            </main>
        </div>
    );
}

