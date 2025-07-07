
"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppData } from '@/context/app-data-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

function PrintPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { penalties, users } = useAppData();
    const { user: adminUser } = useAdminAuth();

    const locationFilter = searchParams.get('location') || 'all';
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    const filteredPenalties = useMemo(() => {
        const fromDate = fromDateStr ? startOfDay(parseISO(fromDateStr)) : null;
        const toDate = toDateStr ? endOfDay(parseISO(toDateStr)) : null;

        return penalties
          .filter((penalty) => {
            const penaltyUser = users.find(u => u.id === penalty.userId);
            if (!penaltyUser) return false;

            if (locationFilter !== "all" && penaltyUser.location !== locationFilter) return false;

            if (adminUser?.role === 'LOCATION_ADMIN' && penaltyUser.location !== adminUser.location) return false;

            if (fromDate && toDate) {
              const penaltyDate = new Date(penalty.timestamp);
              if (isBefore(penaltyDate, fromDate) || isAfter(penaltyDate, toDate)) return false;
            }
            
            return true;
          })
          .sort((a, b) => a.timestamp - b.timestamp); // Sort oldest to newest for history
    }, [penalties, users, locationFilter, fromDateStr, toDateStr, adminUser]);

    const locationDisplay = locationFilter === 'all' ? 'Semua Lokasi' : locationFilter;
    const dateRangeDisplay = fromDateStr && toDateStr ? 
        `${format(parseISO(fromDateStr), 'dd MMM yyyy', {locale: localeID})} - ${format(parseISO(toDateStr), 'dd MMM yyyy', {locale: localeID})}` 
        : 'Semua Waktu';
    const printDate = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeID });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Cetak Riwayat Penalti</h1>
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
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Riwayat Penalti Pengguna</h2>
                        
                        <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                            <div><span className="font-semibold">Lokasi:</span> {locationDisplay}</div>
                            <div><span className="font-semibold">Rentang Waktu:</span> {dateRangeDisplay}</div>
                            <div><span className="font-semibold">Jumlah Penalti:</span> {filteredPenalties.length}</div>
                            <div><span className="font-semibold">Tanggal Cetak:</span> {printDate}</div>
                        </div>
                        
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">Tanggal</th>
                                    <th className="border border-gray-600 p-2 text-left">Penerima</th>
                                    <th className="border border-gray-600 p-2 text-left">Kendaraan</th>
                                    <th className="border border-gray-600 p-2 text-center">Penalty</th>
                                    <th className="border border-gray-600 p-2 text-left">Alasan</th>
                                    <th className="border border-gray-600 p-2 text-left">Diberikan Oleh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPenalties.length > 0 ? filteredPenalties.map(penalty => {
                                    const user = users.find(u => u.id === penalty.userId);
                                    return (
                                        <tr key={penalty.id} className="even:bg-gray-50 align-top">
                                            <td className="border border-gray-600 p-2 whitespace-nowrap">{format(new Date(penalty.timestamp), 'dd MMM yyyy, HH:mm')}</td>
                                            <td className="border border-gray-600 p-2">{penalty.userName}<br/><span className="text-gray-500">{user?.role} / {penalty.userNik}</span></td>
                                            <td className="border border-gray-600 p-2">{penalty.vehicleHullNumber}</td>
                                            <td className="border border-gray-600 p-2 text-center font-bold">{penalty.points}</td>
                                            <td className="border border-gray-600 p-2">{penalty.reason}</td>
                                            <td className="border border-gray-600 p-2">{penalty.givenByAdminUsername}</td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={6} className="border border-gray-600 p-4 text-center">Tidak ada data untuk filter yang dipilih.</td>
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

export default function PenaltyPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
