
"use client";

import React, { useState, useMemo, useEffect } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
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
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

// Re-using the badge logic from dashboard for consistency
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

export default function HistoryPage() {
  const { reports, vehicles } = useAppData();
  const { user } = useAdminAuth();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [rangePreset, setRangePreset] = useState<string>("last30days");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const vehiclesForUser = useMemo(() => {
    if (user?.role === 'LOCATION_ADMIN' && user.location) {
        return vehicles.filter(v => v.location === user.location);
    }
    return vehicles;
  }, [vehicles, user]);

  const handlePresetChange = (preset: string) => {
    setRangePreset(preset);
    const to = new Date();
    switch (preset) {
      case "today":
        setDate({ from: to, to });
        break;
      case "last7days":
        setDate({ from: subDays(to, 6), to });
        break;
      case "last30days":
        setDate({ from: subDays(to, 29), to });
        break;
      case "this_month":
        setDate({ from: startOfDay(new Date(to.getFullYear(), to.getMonth(), 1)), to: endOfDay(to)});
        break;
      case "last_month":
        const lastMonth = subDays(to, to.getDate() + 1);
        setDate({ from: startOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)), to: endOfDay(new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0))});
        break;
      case "custom":
        // let the picker handle it
        break;
    }
  };

  const filteredReports = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

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
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [reports, selectedVehicleId, date, user]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Laporan Alat</CardTitle>
          <CardDescription>
            Tinjau riwayat laporan checklist untuk setiap alat berdasarkan rentang waktu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
              <SelectTrigger className="md:w-[250px]">
                <SelectValue placeholder="Pilih Alat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Alat</SelectItem>
                {vehiclesForUser.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.hullNumber}>
                    {vehicle.hullNumber} ({vehicle.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={rangePreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="md:w-[180px]">
                    <SelectValue placeholder="Pilih Rentang" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Hari Ini</SelectItem>
                    <SelectItem value="last7days">7 Hari Terakhir</SelectItem>
                    <SelectItem value="last30days">30 Hari Terakhir</SelectItem>
                    <SelectItem value="this_month">Bulan Ini</SelectItem>
                    <SelectItem value="last_month">Bulan Lalu</SelectItem>
                    <SelectItem value="custom">Pilih Tanggal</SelectItem>
                </SelectContent>
            </Select>

            {rangePreset === 'custom' && (
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                        "w-full md:w-[300px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pilih rentang tanggal</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                    </PopoverContent>
                </Popover>
            )}
          </div>
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
                {filteredReports.length > 0 ? (
                  filteredReports.map((report) => (
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
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Tidak ada laporan ditemukan untuk filter yang dipilih.
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
