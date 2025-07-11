
"use client";

import React, { useState, useMemo } from "react";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";
import { Report, ReportItem } from "@/lib/data";
import { format, subDays, eachDayOfInterval, isSameDay, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Baik":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Baik</Badge>;
    case "Perlu Perhatian":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Perlu Perhatian</Badge>;
    case "Rusak":
      return <Badge variant="destructive">Rusak</Badge>;
    case "Tidak Ada Checklist":
       return <Badge variant="outline">Tidak Ada Checklist</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function OperatorHistoryPage() {
    const { user: operator } = useOperatorAuth();
    const { reports } = useAppData();
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const myHistory = useMemo(() => {
        if (!operator) return [];

        const operatorReports = reports.filter(r => r.operatorName === operator.name);

        const end = startOfDay(new Date());
        const start = subDays(end, 29); // Last 30 days including today
        const dateInterval = eachDayOfInterval({ start, end }).reverse();

        return dateInterval.map(date => {
            const reportForDay = operatorReports.find(r => isSameDay(new Date(r.timestamp), date));
            
            if (reportForDay) {
                return reportForDay;
            } else {
                return {
                    id: date.toISOString(),
                    timestamp: date.getTime(),
                    vehicleId: 'N/A',
                    overallStatus: 'Tidak Ada Checklist',
                    isPlaceholder: true,
                };
            }
        });
    }, [reports, operator]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Checklist Saya</CardTitle>
                    <CardDescription>Menampilkan riwayat checklist Anda selama 30 hari terakhir.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kendaraan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myHistory.length > 0 ? (
                                    myHistory.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(new Date(item.timestamp), (item as any).isPlaceholder ? 'dd MMM yyyy' : 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                                            <TableCell>{item.vehicleId}</TableCell>
                                            <TableCell>{getStatusBadge(item.overallStatus)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setSelectedReport(item as Report)}
                                                    disabled={(item as any).isPlaceholder}
                                                >
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Memuat riwayat...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="sm:max-w-lg">
                  {selectedReport && (
                    <>
                    <DialogHeader>
                        <DialogTitle>Detail Laporan: {selectedReport.vehicleId}</DialogTitle>
                        <DialogDescription>
                            Laporan oleh Anda pada {format(new Date(selectedReport.timestamp), 'dd MMMM yyyy, HH:mm', { locale: localeID })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Item Checklist</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {selectedReport.items && selectedReport.items.length > 0 ? selectedReport.items.map((item: ReportItem, index: number) => (
                                    <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{item.label}</p>
                                            {getStatusBadge(item.status === 'BAIK' ? 'Baik' : item.status === 'RUSAK' ? 'Rusak' : 'Perlu Perhatian')}
                                        </div>
                                        {item.status !== 'BAIK' && (
                                          <>
                                            <p className="text-sm mt-1">{item.keterangan || "Tidak ada keterangan."}</p>
                                            {item.foto && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                                    <a href={item.foto} target="_blank" rel="noopener noreferrer">
                                                        <img src={item.foto} alt={`Foto ${item.label}`} className="rounded-md w-full max-w-xs cursor-pointer" data-ai-hint="machine damage" />
                                                    </a>
                                                </div>
                                            )}
                                          </>
                                        )}
                                    </div>
                                )) : <p className="text-muted-foreground">Semua item checklist dalam kondisi baik.</p>}
                            </CardContent>
                        </Card>

                        {selectedReport.kerusakanLain && selectedReport.kerusakanLain.keterangan && (
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Kerusakan Lainnya</CardTitle></CardHeader>
                                <CardContent>
                                    <p>{selectedReport.kerusakanLain.keterangan}</p>
                                    {selectedReport.kerusakanLain.foto && (
                                        <div className="mt-2">
                                            <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                            <a href={selectedReport.kerusakanLain.foto} target="_blank" rel="noopener noreferrer">
                                                <img src={selectedReport.kerusakanLain.foto} alt="Foto Kerusakan Lainnya" className="rounded-md w-full max-w-xs cursor-pointer" data-ai-hint="machine part" />
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    </>
                  )}
                </DialogContent>
            </Dialog>
        </>
    );
};
