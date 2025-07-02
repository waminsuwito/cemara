
"use client";

import React, { useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAppData } from '@/context/app-data-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { format, parseISO, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { type Report } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

function PrintPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { reports, vehicles } = useAppData();
    const { user } = useAdminAuth();

    const selectedVehicleId = searchParams.get('vehicleId') || 'all';
    const fromDateStr = searchParams.get('from');
    const toDateStr = searchParams.get('to');

    const filteredReports = useMemo(() => {
        const fromDate = fromDateStr ? startOfDay(parseISO(fromDateStr)) : null;
        const toDate = toDateStr ? endOfDay(parseISO(toDateStr)) : null;

        return reports
          .filter((report) => {
            // Filter by vehicle
            if (selectedVehicleId !== "all" && report.vehicleId !== selectedVehicleId) {
              return false;
            }

            // Filter by user's location if location admin
            if (user?.role === 'LOCATION_ADMIN' && user.location && report.location !== user.location) {
                return false;
            }

            // Filter by date range
            if (fromDate && toDate) {
              const reportDate = new Date(report.timestamp);
              if (isBefore(reportDate, fromDate) || isAfter(reportDate, toDate)) {
                return false;
              }
            }
            return true;
          })
          .sort((a, b) => a.timestamp - b.timestamp); // Sort oldest to newest for history
    }, [reports, selectedVehicleId, fromDateStr, toDateStr, user]);

    const vehicle = selectedVehicleId !== 'all' ? vehicles.find(v => v.hullNumber === selectedVehicleId) : null;
    const vehicleDisplay = vehicle ? `${vehicle.hullNumber} (${vehicle.type})` : 'Semua Alat';
    const dateRangeDisplay = fromDateStr && toDateStr ? 
        `${format(parseISO(fromDateStr), 'dd MMMM yyyy', {locale: localeID})} - ${format(parseISO(toDateStr), 'dd MMMM yyyy', {locale: localeID})}` 
        : 'Semua Waktu';
    const printDate = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeID });
    
    const handlePrint = () => {
        window.print();
    };

    const damagedReports = filteredReports.filter(r => r.overallStatus !== 'Baik');

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Cetak Riwayat Laporan</h1>
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
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Riwayat Alat</h2>
                        
                        <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                            <div><span className="font-semibold">Alat:</span> {vehicleDisplay}</div>
                            <div><span className="font-semibold">Rentang Waktu:</span> {dateRangeDisplay}</div>
                            <div><span className="font-semibold">Jumlah Laporan:</span> {filteredReports.length}</div>
                            <div><span className="font-semibold">Tanggal Cetak:</span> {printDate}</div>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2 mt-8">Detail Laporan</h3>
                        
                        <div className="space-y-6">
                            {filteredReports.length > 0 ? filteredReports.map(report => (
                                <div key={report.id} className="border border-gray-400 p-4 rounded-md break-inside-avoid">
                                    <div className="grid grid-cols-5 gap-4 mb-3 border-b border-gray-300 pb-3">
                                        <div><strong className="block text-xs text-gray-500">Tanggal</strong>{format(new Date(report.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</div>
                                        <div><strong className="block text-xs text-gray-500">Kendaraan</strong>{report.vehicleId}</div>
                                        <div><strong className="block text-xs text-gray-500">Operator</strong>{report.operatorName}</div>
                                        <div><strong className="block text-xs text-gray-500">Lokasi</strong>{report.location}</div>
                                        <div><strong className="block text-xs text-gray-500">Status</strong>{report.overallStatus}</div>
                                    </div>
                                    
                                    <h4 className="font-semibold text-sm mb-2">Rincian Kerusakan:</h4>
                                    { (report.items?.filter(item => item.status !== 'BAIK').length > 0 || (report.kerusakanLain && report.kerusakanLain.keterangan)) ? (
                                        <table className="w-full text-xs border-collapse border border-gray-300">
                                            <thead className="bg-gray-100">
                                                <tr>
                                                    <th className="border border-gray-300 p-1.5 text-left">Item</th>
                                                    <th className="border border-gray-300 p-1.5 text-left">Status</th>
                                                    <th className="border border-gray-300 p-1.5 text-left">Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {report.items?.filter(item => item.status !== 'BAIK').map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="border border-gray-300 p-1.5">{item.label}</td>
                                                        <td className="border border-gray-300 p-1.5 font-semibold">{item.status}</td>
                                                        <td className="border border-gray-300 p-1.5">{item.keterangan || '-'}</td>
                                                    </tr>
                                                ))}
                                                {report.kerusakanLain?.keterangan && (
                                                    <tr>
                                                        <td className="border border-gray-300 p-1.5 font-semibold">Kerusakan Lainnya</td>
                                                        <td className="border border-gray-300 p-1.5 font-semibold">RUSAK</td>
                                                        <td className="border border-gray-300 p-1.5">{report.kerusakanLain.keterangan}</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-xs text-gray-600">Tidak ada kerusakan yang dilaporkan.</p>
                                    )}
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-10">Tidak ada laporan ditemukan untuk filter yang dipilih.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function HistoryPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
