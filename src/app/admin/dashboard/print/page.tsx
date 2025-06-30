
"use client";

import React, { useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppData } from "@/context/app-data-context";
import { Printer, ArrowLeft } from "lucide-react";
import { format, isSameDay, isBefore, startOfToday } from "date-fns";
import { id as localeID } from "date-fns/locale";
import type { Report, Vehicle } from "@/lib/data";
import Link from "next/link";

type VehicleWithStatus = Vehicle & { status: string; latestReport?: Report };


// This component fetches the data and controls the UI (header with buttons)
function PrintPageContent() {
    const searchParams = useSearchParams();
    const { vehicles, reports } = useAppData();
    const selectedLocation = searchParams.get('location') || 'all';
    
    // This effect manually attaches the print event listener to the button.
    // This is a robust way to bypass any potential framework interference that
    // might have been blocking window.print() before.
    useEffect(() => {
        const printButton = document.getElementById('print-report-button');
        if (printButton) {
            const handlePrint = () => window.print();
            printButton.addEventListener('click', handlePrint);

            // Cleanup the event listener when the component unmounts
            return () => {
                printButton.removeEventListener('click', handlePrint);
            }
        }
    }, []);

    const vehiclesWithStatus = useMemo(() => {
        const today = startOfToday();
        return vehicles.map((vehicle): VehicleWithStatus => {
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
    }, [vehicles, reports]);

    const vehiclesForPrint = selectedLocation === "all"
        ? vehiclesWithStatus
        : vehiclesWithStatus.filter(v => v.location === selectedLocation);

    const locationDisplay = selectedLocation === 'all' ? 'Semua Lokasi' : selectedLocation;
    const printDate = format(new Date(), 'dd MMMM yyyy', { locale: localeID });
    
    const damagedVehicles = vehiclesForPrint.filter(
        v => (v.status === 'Rusak' || v.status === 'Perlu Perhatian') && v.latestReport
    );

    const totalCount = vehiclesForPrint.length;
    const baikCount = vehiclesForPrint.filter((v) => v.status === "Baik").length;
    const rusakCount = vehiclesForPrint.filter((v) => v.status === "Rusak").length;
    const perhatianCount = vehiclesForPrint.filter((v) => v.status === "Perlu Perhatian").length;
    const notCheckedInCount = vehiclesForPrint.filter((v) => v.status === "Belum Checklist").length;
    const checkedInCount = totalCount - notCheckedInCount;
  
    const stats = [
        { label: 'Total Alat', value: totalCount },
        { label: 'Alat Sudah Checklist', value: checkedInCount },
        { label: 'Alat Belum Checklist', value: notCheckedInCount },
        { label: 'Kondisi Baik', value: baikCount },
        { label: 'Perlu Perhatian', value: perhatianCount },
        { label: 'Kondisi Rusak', value: rusakCount },
    ];


    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
                <h1 className="text-xl font-semibold">Pratinjau Cetak Laporan</h1>
                <div className="flex gap-2">
                    <Link
                        href={`/admin/dashboard?location=${selectedLocation}`}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali ke Dasbor
                    </Link>
                    <button
                        id="print-report-button"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-primary/50 hover:shadow-[0_0_15px_var(--primary)] h-10 px-4 py-2"
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Laporan
                    </button>
                </div>
            </header>
            <main className="p-8 print-page-main">
                <div className="max-w-4xl mx-auto bg-white shadow-lg print-page-container">
                    <div className="print-page-report p-10 text-black bg-white font-sans">
                        <h1 className="text-3xl font-bold mb-2 text-center">PT FARIKA RIAU PERKASA</h1>
                        <h2 className="text-xl font-semibold mb-4 text-center">Laporan Harian Kondisi Alat</h2>
                        <div className="flex justify-between mb-6">
                            <p><span className="font-semibold">Lokasi:</span> {locationDisplay}</p>
                            <p><span className="font-semibold">Tanggal:</span> {printDate}</p>
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2 mt-6">Ringkasan Status</h3>
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">Status Kondisi</th>
                                    <th className="border border-gray-600 p-2 text-right">Jumlah Alat</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((stat, index) => (
                                    <tr key={index} className="even:bg-gray-50">
                                        <td className="border border-gray-600 p-2">{stat.label}</td>
                                        <td className="border border-gray-600 p-2 text-right">{stat.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <h3 className="text-lg font-semibold mb-2 mt-8">Daftar Alat dan Operator</h3>
                        <table className="w-full text-sm border-collapse border border-gray-600">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="border border-gray-600 p-2 text-left">No.</th>
                                    <th className="border border-gray-600 p-2 text-left">Nomor Lambung</th>
                                    <th className="border border-gray-600 p-2 text-left">Jenis Alat</th>
                                    <th className="border border-gray-600 p-2 text-left">Sopir/Operator</th>
                                    <th className="border border-gray-600 p-2 text-left">Status Hari Ini</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehiclesForPrint.map((vehicle, index) => (
                                    <tr key={vehicle.id} className="even:bg-gray-50">
                                        <td className="border border-gray-600 p-2">{index + 1}</td>
                                        <td className="border border-gray-600 p-2">{vehicle.hullNumber}</td>
                                        <td className="border border-gray-600 p-2">{vehicle.type}</td>
                                        <td className="border border-gray-600 p-2">{vehicle.operator}</td>
                                        <td className="border border-gray-600 p-2">{vehicle.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {damagedVehicles.length > 0 && (
                            <>
                                <div className="break-after-page"></div>
                                <h3 className="text-lg font-semibold mb-2 mt-8">Detail Laporan Kerusakan</h3>
                                <table className="w-full text-sm border-collapse border border-gray-600">
                                    <thead>
                                        <tr className="bg-gray-200">
                                            <th className="border border-gray-600 p-2 text-left">Nomor Lambung</th>
                                            <th className="border border-gray-600 p-2 text-left">Detail Kerusakan</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {damagedVehicles.map((vehicle) => (
                                            <tr key={`damage-${vehicle.id}`} className="even:bg-gray-50 align-top">
                                                <td className="border border-gray-600 p-2 font-semibold">{vehicle.hullNumber}</td>
                                                <td className="border border-gray-600 p-2">
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {vehicle.latestReport?.items?.filter(item => item.status !== 'BAIK').map((item, index) => (
                                                            <li key={index}>
                                                                <strong>{item.label} ({item.status}):</strong> {item.keterangan || 'Tidak ada keterangan.'}
                                                            </li>
                                                        ))}
                                                        {vehicle.latestReport?.kerusakanLain?.keterangan && (
                                                            <li>
                                                                <strong>Kerusakan Lainnya:</strong> {vehicle.latestReport.kerusakanLain.keterangan}
                                                            </li>
                                                        )}
                                                    </ul>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        <div className="mt-12 text-sm text-gray-500">
                            <p>Laporan ini dibuat secara otomatis oleh sistem Checklist Harian Alat.</p>
                            <p>Dicetak pada: {format(new Date(), 'dd MMMM yyyy, HH:mm:ss')}</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Main page component using Suspense for searchParams
export default function PrintPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Memuat pratinjau...</div>}>
            <PrintPageContent />
        </Suspense>
    );
}
