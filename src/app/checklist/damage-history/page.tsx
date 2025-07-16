
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppData } from "@/context/app-data-context";
import { useOperatorAuth } from "@/context/operator-auth-context";
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

export default function OperatorDamageHistoryPage() {
  const { reports, vehicles } = useAppData();
  const { user } = useOperatorAuth();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const vehiclesForUser = useMemo(() => {
    if (!user || !user.batangan) return [];
    const batanganList = user.batangan.split(',').map(b => b.trim().toLowerCase());
    return vehicles.filter(v => 
        batanganList.includes(v.licensePlate.trim().toLowerCase())
    );
  }, [vehicles, user]);

  const filteredReports = useMemo(() => {
    // Filter for reports related to the vehicles the user is responsible for
    const vehicleHullNumbers = new Set(vehiclesForUser.map(v => v.hullNumber));
    
    return reports
      .filter((report) => {
        // Must be a report for a vehicle the user is assigned to
        if (!vehicleHullNumbers.has(report.vehicleId)) {
            return false;
        }

        // Only show reports with damage
        if (report.overallStatus !== 'Rusak' && report.overallStatus !== 'Perlu Perhatian') {
            return false;
        }

        // Filter by the selected vehicle from the dropdown
        if (selectedVehicleId !== "all" && report.vehicleId !== selectedVehicleId) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [reports, selectedVehicleId, vehiclesForUser]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kerusakan Alat</CardTitle>
          <CardDescription>
            Tinjau riwayat laporan kerusakan untuk semua alat yang Anda operasikan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="md:w-[250px]">
                <SelectValue placeholder="Pilih Alat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Alat Saya</SelectItem>
                {vehiclesForUser.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.hullNumber}>
                    {vehicle.hullNumber} ({vehicle.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead>Alat</TableHead>
                  <TableHead>Operator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{format(new Date(report.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                      <TableCell className="font-medium">{report.vehicleId}</TableCell>
                      <TableCell>{report.operatorName}</TableCell>
                      <TableCell>{getStatusBadge(report.overallStatus)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReport(report)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Tidak ada laporan kerusakan ditemukan untuk alat yang Anda pilih.
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
                    Laporan oleh {selectedReport.operatorName} pada {format(new Date(selectedReport.timestamp), 'dd MMMM yyyy, HH:mm', { locale: localeID })}
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
}
