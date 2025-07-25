
"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppData } from '@/context/app-data-context';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { type MechanicTask } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

function PrintPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { mechanicTasks, vehicles } = useAppData();
    const locationFilter = searchParams.get('location') || 'all';

    const filteredTasks = useMemo(() => {
        return mechanicTasks.filter(task => {
            const taskLocation = vehicles.find(v => v.hullNumber === task.vehicle?.hullNumber)?.location;

            if (locationFilter === 'all') return true;
            return taskLocation === locationFilter;
        }).sort((a,b) => b.createdAt - a.createdAt);
    }, [mechanicTasks, locationFilter, vehicles]);

    const locationDisplay = locationFilter === 'all' ? 'Semua Lokasi' : locationFilter;
    const printDate = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeID });
    
    const handlePrint = () => {
        window.print();
    };

    const getTaskStatusText = (task: MechanicTask): string => {
        switch (task.status) {
            case 'PENDING':
                return 'MENUNGGU';
            case 'IN_PROGRESS':
                return 'DIKERJAKAN';
            case 'DELAYED':
                return 'TERTUNDA';
            case 'COMPLETED':
                const vehicleInTask = task.vehicle;
                if (!vehicleInTask || !task.completedAt) {
                    return 'SELESAI';
                }
                const { targetDate, targetTime } = vehicleInTask;
                const { completedAt } = task;

                if (!targetDate || !targetTime || !completedAt) {
                    return 'SELESAI';
                }

                const targetDateTime = new Date(`${targetDate}T${targetTime}`);
                const completedDateTime = new Date(completedAt);
                const diffMinutes = Math.round((completedDateTime.getTime() - targetDateTime.getTime()) / (60 * 1000));

                if (diffMinutes <= 5 && diffMinutes >= -5) {
                    return 'SELESAI (Tepat Waktu)';
                }

                if (diffMinutes < -5) {
                    const diffAbs = Math.abs(diffMinutes);
                    const hours = Math.floor(diffAbs / 60);
                    const minutes = diffAbs % 60;
                    let text = 'Lebih Cepat';
                    if (hours > 0) text += ` ${hours} jam`;
                    if (minutes > 0) text += ` ${minutes} menit`;
                    return `SELESAI (${text})`;
                } else { // diffMinutes > 5
                    const hours = Math.floor(diffMinutes / 60);
                    const minutes = diffMinutes % 60;
                    let text = 'Terlambat';
                    if (hours > 0) text += ` ${hours} jam`;
                    if (minutes > 0) text += ` ${minutes} menit`;
                    return `SELESAI (${text})`;
                }
            default:
                return task.status;
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Cetak Laporan Kegiatan Mekanik</h1>
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
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Kegiatan Mekanik</h2>

                        <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                            <div><span className="font-semibold">Lokasi:</span> {locationDisplay}</div>
                            <div><span className="font-semibold">Tanggal Cetak:</span> {printDate}</div>
                        </div>

                        <h3 className="text-lg font-semibold mb-2 mt-8">Daftar Kegiatan</h3>
                        
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">Tanggal</th>
                                    <th className="border border-gray-600 p-2 text-left">Detail Pekerjaan</th>
                                    <th className="border border-gray-600 p-2 text-left">Mekanik</th>
                                    <th className="border border-gray-600 p-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTasks.length > 0 ? filteredTasks.map(task => (
                                    <tr key={task.id} className="even:bg-gray-50 align-top">
                                        <td className="border border-gray-600 p-2 whitespace-nowrap">{format(new Date(task.createdAt), 'dd MMM yyyy', { locale: localeID })}</td>
                                        <td className="border border-gray-600 p-2">
                                            {task.vehicle && (
                                                <div>
                                                    <p className="font-semibold">{task.vehicle.licensePlate} ({task.vehicle.hullNumber})</p>
                                                    <p className="text-xs">&bull; {task.vehicle.repairDescription}</p>
                                                    <p className="text-xs">&bull; Target: {format(new Date(`${task.vehicle.targetDate}T${task.vehicle.targetTime}`), 'dd MMM yyyy, HH:mm')}</p>
                                                    {task.completedAt && <p className="text-xs">&bull; Selesai: {format(new Date(task.completedAt), 'dd MMM yyyy, HH:mm')}</p>}
                                                    {task.status === 'DELAYED' && task.delayReason && <p className="text-xs italic">&bull; Alasan Tertunda: {task.delayReason}</p>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="border border-gray-600 p-2">{task.mechanics.map(m => m.name).join(', ')}</td>
                                        <td className="border border-gray-600 p-2">{getTaskStatusText(task)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="border border-gray-600 p-4 text-center">Tidak ada kegiatan untuk lokasi ini.</td>
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

export default function MechanicActivityPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
