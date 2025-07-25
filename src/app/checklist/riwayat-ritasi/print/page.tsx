
"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppData } from '@/context/app-data-context';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay, parse } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

const calculateDuration = (startStr?: string, endStr?: string, date?: string | number | Date): number | null => {
    if (!startStr || !endStr || !date) return null;
    try {
        const baseDate = new Date(date).toISOString().split('T')[0];
        const startTime = parse(startStr, 'HH:mm:ss', new Date(`${baseDate}T00:00:00`));
        const endTime = parse(endStr, 'HH:mm:ss', new Date(`${baseDate}T00:00:00`));

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return null;

        let diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // difference in minutes
        
        if (diff < 0) { // Handles overnight scenario, assumes it's next day
            diff += 24 * 60;
        }

        return Math.round(diff);
    } catch (e) {
        return null;
    }
}

function PrintPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { ritasiLogs } = useAppData();
    const { user } = useOperatorAuth();

    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    const filteredRitasi = useMemo(() => {
        if (!user) return [];

        const fromDate = fromDateStr ? startOfDay(parseISO(fromDateStr)) : null;
        const toDate = toDateStr ? endOfDay(parseISO(toDateStr)) : null;

        return ritasiLogs.filter(log => {
            if (log.operatorId !== user.id) return false;

            if (fromDate && toDate) {
              const logDate = new Date(log.timestamp);
              if (isBefore(logDate, fromDate) || isAfter(logDate, toDate)) return false;
            }
            return true;
        }).sort((a, b) => a.timestamp - b.timestamp);
    }, [ritasiLogs, user, fromDateStr, toDateStr]);
    
    const handlePrint = () => {
        window.print();
    };

    const dateRangeDisplay = fromDateStr && toDateStr ? 
        `${format(parseISO(fromDateStr), 'd MMMM yyyy', {locale: localeID})} - ${format(parseISO(toDateStr), 'd MMMM yyyy', {locale: localeID})}` 
        : 'Semua Waktu';
    const printDate = format(new Date(), 'd MMMM yyyy, HH:mm', { locale: localeID });

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Cetak Riwayat Ritasi</h1>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Kembali
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Cetak Halaman Ini
                    </Button>
                </div>
            </header>
            
            <main className="p-8 print-page-main">
                <div className="max-w-4xl mx-auto bg-white shadow-lg print-page-container">
                    <div className="print-page-report p-10 text-black bg-white font-sans">
                        <h1 className="text-3xl font-bold mb-2 text-center">PT FARIKA RIAU PERKASA</h1>
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Riwayat Ritasi</h2>
                        
                        <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                            <div><span className="font-semibold">Operator:</span> {user?.name}</div>
                            <div><span className="font-semibold">Rentang Waktu:</span> {dateRangeDisplay}</div>
                            <div><span className="font-semibold">Jumlah Ritasi:</span> {filteredRitasi.length}</div>
                            <div><span className="font-semibold">Tanggal Cetak:</span> {printDate}</div>
                        </div>
                        
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">Tanggal</th>
                                    <th className="border border-gray-600 p-2 text-left">Asal &gt; Tujuan</th>
                                    <th className="border border-gray-600 p-2 text-center">Berangkat</th>
                                    <th className="border border-gray-600 p-2 text-center">Pergi (m)</th>
                                    <th className="border border-gray-600 p-2 text-center">Sampai</th>
                                    <th className="border border-gray-600 p-2 text-center">Di Lokasi (m)</th>
                                    <th className="border border-gray-600 p-2 text-center">Kembali</th>
                                    <th className="border border-gray-600 p-2 text-center">Pulang (m)</th>
                                    <th className="border border-gray-600 p-2 text-center">Tiba</th>
                                    <th className="border border-gray-600 p-2 text-center">Total (m)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRitasi.length > 0 ? filteredRitasi.map(log => {
                                    const pergi = calculateDuration(log.berangkat, log.sampai, log.timestamp);
                                    const diLokasi = calculateDuration(log.sampai, log.kembali, log.timestamp);
                                    const pulang = calculateDuration(log.kembali, log.tiba, log.timestamp);
                                    const total = calculateDuration(log.berangkat, log.tiba, log.timestamp);
                                    return (
                                        <tr key={log.id} className="even:bg-gray-50 align-top">
                                            <td className="border border-gray-600 p-2 whitespace-nowrap">{format(new Date(log.timestamp), 'd MMM yyyy')}</td>
                                            <td className="border border-gray-600 p-2">{log.asal} &gt; {log.tujuan}</td>
                                            <td className="border border-gray-600 p-2 text-center">{log.berangkat || '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center font-medium">{pergi ?? '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center">{log.sampai || '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center font-medium">{diLokasi ?? '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center">{log.kembali || '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center font-medium">{pulang ?? '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center">{log.tiba || '-'}</td>
                                            <td className="border border-gray-600 p-2 text-center font-bold">{total ?? '-'}</td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={10} className="border border-gray-600 p-4 text-center">Tidak ada data untuk filter yang dipilih.</td>
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

export default function RitasiHistoryPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
