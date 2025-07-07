
"use client";

import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/context/app-data-context';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';

function PrintPageContent() {
    const router = useRouter();
    const { complaints } = useAppData();
    
    const handlePrint = () => {
        window.print();
    };
    
    const printDate = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeID });

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Cetak Laporan Komplain</h1>
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
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Komplain dari Sopir</h2>
                        
                        <div className="grid grid-cols-2 gap-x-8 mb-6 text-sm">
                            <div><span className="font-semibold">Jumlah Komplain:</span> {complaints.length}</div>
                            <div><span className="font-semibold">Tanggal Cetak:</span> {printDate}</div>
                        </div>
                        
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">Tanggal</th>
                                    <th className="border border-gray-600 p-2 text-left">Operator</th>
                                    <th className="border border-gray-600 p-2 text-left">Kendaraan</th>
                                    <th className="border border-gray-600 p-2 text-left">Lokasi</th>
                                    <th className="border border-gray-600 p-2 text-left w-[40%]">Isi Komplain</th>
                                    <th className="border border-gray-600 p-2 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.length > 0 ? complaints.map(item => (
                                    <tr key={item.id} className="even:bg-gray-50 align-top">
                                        <td className="border border-gray-600 p-2 whitespace-nowrap">{format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm')}</td>
                                        <td className="border border-gray-600 p-2">{item.operatorName}</td>
                                        <td className="border border-gray-600 p-2">{item.vehicleId}</td>
                                        <td className="border border-gray-600 p-2">{item.location}</td>
                                        <td className="border border-gray-600 p-2">{item.complaint}</td>
                                        <td className="border border-gray-600 p-2">{item.status}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="border border-gray-600 p-4 text-center">Tidak ada komplain.</td>
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

export default function ComplaintsPrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
