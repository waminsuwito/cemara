
"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppData } from '@/context/app-data-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import type { SparePartLog, Report, MechanicTask } from '@/lib/data';

const DamageDetails = ({ log, reports, mechanicTasks }: { log: SparePartLog, reports: Report[], mechanicTasks: MechanicTask[] }) => {
    const task = mechanicTasks.find((t) => t.id === log.taskId);
    if (!task) {
        return <p className="text-xs italic">Tidak ada detail pekerjaan terkait.</p>;
    }

    const report = reports.find((r) => r.id === task.vehicle?.triggeringReportId);

    const problemItems = report?.items?.filter((item) => item.status !== 'BAIK') || [];
    const otherDamage = report?.kerusakanLain;

    return (
        <div className="text-xs space-y-1">
            <p><strong>WO Mekanik:</strong> {task.vehicle.repairDescription}</p>
            { (problemItems.length > 0 || otherDamage?.keterangan) && (
                 <div className="pt-1 mt-1 border-t border-gray-300">
                    <p className="font-semibold">Laporan Sopir:</p>
                    <ul className="list-disc pl-4">
                        {problemItems.map((item, index) => (
                            <li key={index}><strong>{item.label} ({item.status}):</strong> {item.keterangan || '-'}</li>
                        ))}
                        {otherDamage?.keterangan && (
                             <li><strong>Kerusakan Lain:</strong> {otherDamage.keterangan}</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

function PrintPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { sparePartLogs, vehicles, reports, mechanicTasks } = useAppData();
    const { user } = useAdminAuth();

    const locationFilter = searchParams.get('location') || 'all';
    const selectedVehicleId = searchParams.get('vehicleId') || 'all';
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    const filteredLogs = useMemo(() => {
        const fromDate = fromDateStr ? startOfDay(parseISO(fromDateStr)) : null;
        const toDate = toDateStr ? endOfDay(parseISO(toDateStr)) : null;

        return sparePartLogs
          .filter((log) => {
            const vehicle = vehicles.find(v => v.hullNumber === log.vehicleHullNumber);
            if (!vehicle) return false;

            if (locationFilter !== 'all' && vehicle.location !== locationFilter) return false;
            
            if (user?.role === 'LOCATION_ADMIN' && vehicle.location !== user.location) return false;

            if (selectedVehicleId !== "all" && log.vehicleHullNumber !== selectedVehicleId) return false;

            if (fromDate && toDate) {
              const logDate = new Date(log.logDate);
              if (isBefore(logDate, fromDate) || isAfter(logDate, toDate)) return false;
            }
            
            return true;
          })
          .sort((a, b) => a.logDate - b.logDate);
    }, [sparePartLogs, locationFilter, selectedVehicleId, fromDateStr, toDateStr, user, vehicles]);
    
    const handlePrint = () => {
        window.print();
    };

    const locationDisplay = locationFilter === 'all' ? 'Semua Lokasi' : locationFilter;
    const vehicleDisplay = selectedVehicleId === 'all' ? 'Semua Alat' : vehicles.find(v => v.hullNumber === selectedVehicleId)?.licensePlate || selectedVehicleId;
    const dateRangeDisplay = fromDateStr && toDateStr ? 
        `${format(parseISO(fromDateStr), 'dd MMM yyyy', {locale: localeID})} - ${format(parseISO(toDateStr), 'dd MMM yyyy', {locale: localeID})}` 
        : 'Semua Waktu';
    const printDate = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeID });

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Cetak Laporan Logistik</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Kembali
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Halaman Ini
                    </Button>
                </div>
            </header>
            
            <main className="p-8 print-page-main">
                <div className="max-w-4xl mx-auto bg-white shadow-lg print-page-container">
                    <div className="print-page-report p-10 text-black bg-white font-sans">
                        <h1 className="text-3xl font-bold mb-2 text-center">PT FARIKA RIAU PERKASA</h1>
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Penggunaan Spare Part</h2>
                        
                        <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                            <div><span className="font-semibold">Lokasi:</span> {locationDisplay}</div>
                            <div><span className="font-semibold">Alat:</span> {vehicleDisplay}</div>
                            <div><span className="font-semibold">Rentang Waktu:</span> {dateRangeDisplay}</div>
                            <div><span className="font-semibold">Tanggal Cetak:</span> {printDate}</div>
                        </div>
                        
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">Tanggal</th>
                                    <th className="border border-gray-600 p-2 text-left">Kendaraan</th>
                                    <th className="border border-gray-600 p-2 text-left w-[30%]">Detail Kerusakan</th>
                                    <th className="border border-gray-600 p-2 text-left w-[30%]">Spare Part Digunakan</th>
                                    <th className="border border-gray-600 p-2 text-left">Diinput Oleh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLogs.length > 0 ? filteredLogs.map(log => {
                                    const vehicle = vehicles.find(v => v.hullNumber === log.vehicleHullNumber);
                                    return (
                                        <tr key={log.id} className="even:bg-gray-50 align-top">
                                            <td className="border border-gray-600 p-2 whitespace-nowrap">{format(new Date(log.logDate), 'dd MMM yyyy')}</td>
                                            <td className="border border-gray-600 p-2">{vehicle?.licensePlate || log.vehicleHullNumber}<br/><span className="text-gray-500">{vehicle?.operator}</span></td>
                                            <td className="border border-gray-600 p-2">
                                                <DamageDetails log={log} reports={reports} mechanicTasks={mechanicTasks} />
                                            </td>
                                            <td className="border border-gray-600 p-2 whitespace-pre-wrap">{log.partsUsed}</td>
                                            <td className="border border-gray-600 p-2">{log.loggedByName}</td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={5} className="border border-gray-600 p-4 text-center">Tidak ada data untuk filter yang dipilih.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        <div className="mt-12 text-sm text-gray-500">
                            <p>Laporan ini dibuat secara otomatis oleh sistem Checklist Harian Alat.</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function LogisticsReportPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
