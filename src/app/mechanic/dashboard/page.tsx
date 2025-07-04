
"use client";

import React, { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { type Report, type ReportItem } from "@/lib/data";
import { format } from "date-fns";
import { id as localeID } from 'date-fns/locale';

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Baik":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Baik</Badge>;
    case "Perlu Perhatian":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Perlu Perhatian</Badge>;
    case "Rusak":
      return <Badge variant="destructive">Rusak</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function MechanicDashboardPage() {
  const { reports } = useAppData();
  const { user } = useAdminAuth();

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const damagedReports = useMemo(() => {
    return reports
      .filter((report) => {
        const isDamaged = report.overallStatus === 'Rusak' || report.overallStatus === 'Perlu Perhatian';
        // If mechanic has a location, filter by it. If not, they see all locations (unless they are super_admin).
        const matchesLocation = user?.role === 'SUPER_ADMIN' || !user?.location || report.location === user.location;
        return isDamaged && matchesLocation;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [reports, user]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Laporan Kerusakan Alat</CardTitle>
          <CardDescription>
            Daftar semua alat yang dilaporkan rusak atau perlu perhatian oleh operator.
            {user?.location && ` Menampilkan laporan untuk lokasi: ${user.location}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Alat</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {damagedReports.length > 0 ? (
                  damagedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{format(new Date(report.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                      <TableCell className="font-medium">{report.vehicleId}</TableCell>
                      <TableCell>{report.operatorName}</TableCell>
                      <TableCell>{report.location}</TableCell>
                      <TableCell>{getStatusBadge(report.overallStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tidak ada laporan kerusakan yang aktif saat ini.
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
                <DialogTitle>Detail Laporan Kerusakan: {selectedReport.vehicleId}</DialogTitle>
                <DialogDescription>
                    Laporan oleh {selectedReport.operatorName} pada {format(new Date(selectedReport.timestamp), 'dd MMMM yyyy, HH:mm', { locale: localeID })}
                </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 space-y-4">
                <Card>
                    <CardHeader><CardTitle className="text-lg">Item Bermasalah</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {selectedReport.items && selectedReport.items.filter(i => i.status !== 'BAIK').length > 0 ? selectedReport.items.filter(i => i.status !== 'BAIK').map((item: ReportItem, index: number) => (
                            <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{item.label}</p>
                                    {getStatusBadge(item.status === 'RUSAK' ? 'Rusak' : 'Perlu Perhatian')}
                                </div>
                                <p className="text-sm mt-1">{item.keterangan || "Tidak ada keterangan."}</p>
                                {item.foto && (
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                        <a href={item.foto} target="_blank" rel="noopener noreferrer">
                                            <img src={item.foto} alt={`Foto ${item.label}`} className="rounded-md w-full max-w-xs cursor-pointer" data-ai-hint="machine damage" />
                                        </a>
                                    </div>
                                )}
                              
                            </div>
                        )) : <p className="text-muted-foreground">Tidak ada item spesifik yang dilaporkan rusak atau perlu perhatian.</p>}
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
}
