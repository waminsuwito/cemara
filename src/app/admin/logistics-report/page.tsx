
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon, Printer, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import type { SparePartLog, Report, MechanicTask } from '@/lib/data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const DamageDetails = ({ log, reports, mechanicTasks }: { log: SparePartLog, reports: Report[], mechanicTasks: MechanicTask[] }) => {
    const task = mechanicTasks.find((t) => t.id === log.taskId);
    if (!task) {
        return <span className="text-xs text-muted-foreground italic">Tidak ada detail pekerjaan terkait.</span>;
    }

    const report = reports.find((r) => r.id === task.vehicle?.triggeringReportId);

    const problemItems = report?.items?.filter((item) => item.status !== 'BAIK') || [];
    const otherDamage = report?.kerusakanLain;

    return (
        <div className="text-xs space-y-1">
            <p><strong className="font-semibold text-foreground">WO Mekanik:</strong> {task.vehicle.repairDescription}</p>
            { (problemItems.length > 0 || otherDamage?.keterangan) && (
                 <div className="pt-1 mt-1 border-t border-dashed">
                    <p className="font-semibold text-foreground">Laporan Sopir:</p>
                    <ul className="list-disc pl-4 text-muted-foreground">
                        {problemItems.map((item, index) => (
                            <li key={index}><strong>{item.label} ({item.status}):</strong> {item.keterangan || '-'}</li>
                        ))}
                        {otherDamage?.keterangan && (
                             <li><strong>Kerusakan Lain:</strong> {otherDamage.keterangan}</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function LogisticsReportPage() {
  const { sparePartLogs, vehicles, locationNames, mechanicTasks, reports, deleteSparePartLog } = useAppData();
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [locationFilter, setLocationFilter] = useState(
    isSuperAdmin ? "all" : user?.location || "all"
  );
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const vehiclesForFilter = useMemo(() => {
    return vehicles.filter(v => {
        if (!isSuperAdmin) {
            return v.location === user?.location;
        }
        if (locationFilter === 'all') return true;
        return v.location === locationFilter;
    }).sort((a, b) => a.licensePlate.localeCompare(b.licensePlate));
  }, [vehicles, locationFilter, isSuperAdmin, user?.location]);

  React.useEffect(() => {
      setSelectedVehicleId('all');
  }, [locationFilter]);

  const filteredLogs = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

    return sparePartLogs
      .filter((log) => {
        const vehicle = vehicles.find(v => v.hullNumber === log.vehicleHullNumber);
        if (!vehicle) return false;

        if (locationFilter !== 'all' && vehicle.location !== locationFilter) {
            return false;
        }
        
        if (!isSuperAdmin && vehicle.location !== user?.location) {
            return false;
        }

        if (selectedVehicleId !== "all" && log.vehicleHullNumber !== selectedVehicleId) {
          return false;
        }

        if (fromDate && toDate) {
          const logDate = new Date(log.logDate);
          if (isBefore(logDate, fromDate) || isAfter(logDate, toDate)) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => b.logDate - a.logDate);
  }, [sparePartLogs, selectedVehicleId, date, vehicles, locationFilter, isSuperAdmin, user?.location]);
  
  const printUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('location', locationFilter);
    params.set('vehicleId', selectedVehicleId);
    if (date?.from) params.set('from', date.from.toISOString());
    if (date?.to) params.set('to', date.to.toISOString());
    return `/admin/logistics-report/print?${params.toString()}`;
  }, [locationFilter, selectedVehicleId, date]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Logistik</CardTitle>
        <CardDescription>
          Tinjau riwayat penggunaan suku cadang untuk perbaikan alat, beserta detail kerusakannya.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center flex-wrap">
          {isSuperAdmin && (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-auto md:min-w-[180px]">
                <SelectValue placeholder="Pilih Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                {locationNames.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger className="w-full md:w-auto md:min-w-[250px]">
              <SelectValue placeholder="Pilih Alat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Alat</SelectItem>
              {vehiclesForFilter.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.hullNumber}>
                  {vehicle.licensePlate} ({vehicle.hullNumber})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full md:w-auto md:min-w-[300px] justify-start text-left font-normal",
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
          <Button asChild>
            <Link href={printUrl}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Laporan
            </Link>
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="w-[30%]">Detail Kerusakan</TableHead>
                <TableHead className="w-[25%]">Spare Part Digunakan</TableHead>
                <TableHead>Diinput Oleh</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const vehicle = vehicles.find(v => v.hullNumber === log.vehicleHullNumber);
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="align-top">{format(new Date(log.logDate), 'dd MMM yyyy', { locale: localeID })}</TableCell>
                      <TableCell className="font-medium align-top">{vehicle?.licensePlate || log.vehicleHullNumber}</TableCell>
                      <TableCell className="align-top">{vehicle?.operator || 'N/A'}</TableCell>
                      <TableCell className="align-top">
                        <DamageDetails log={log} reports={reports} mechanicTasks={mechanicTasks} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap align-top">{log.partsUsed}</TableCell>
                      <TableCell className="align-top">{log.loggedByName}</TableCell>
                       {isSuperAdmin && (
                        <TableCell className="text-right align-top">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Log Ini?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Tindakan ini akan menghapus log penggunaan spare part ini secara permanen.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteSparePartLog(log.id)} className="bg-destructive hover:bg-destructive/90">
                                            Hapus
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isSuperAdmin ? 7 : 6} className="h-24 text-center">
                    Tidak ada riwayat ditemukan untuk filter yang dipilih.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
