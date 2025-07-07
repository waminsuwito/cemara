
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

export default function LogisticsReportPage() {
  const { sparePartLogs, vehicles, locationNames } = useAppData();
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
    });
  }, [vehicles, locationFilter, isSuperAdmin, user?.location]);


  const filteredLogs = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

    return sparePartLogs
      .filter((log) => {
        const vehicle = vehicles.find(v => v.hullNumber === log.vehicleHullNumber);
        if (!vehicle) return false;

        // Filter by location
        if (locationFilter !== 'all' && vehicle.location !== locationFilter) {
            return false;
        }
        
        if (!isSuperAdmin && vehicle.location !== user?.location) {
            return false;
        }

        // Filter by selected vehicle
        if (selectedVehicleId !== "all" && log.vehicleHullNumber !== selectedVehicleId) {
          return false;
        }

        // Filter by date range
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Logistik</CardTitle>
        <CardDescription>
          Tinjau riwayat penggunaan suku cadang untuk perbaikan alat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center flex-wrap">
          {isSuperAdmin && (
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
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
            <SelectTrigger className="md:w-[250px]">
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
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead className="w-[40%]">Spare Part Digunakan</TableHead>
                <TableHead>Diinput Oleh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const vehicle = vehicles.find(v => v.hullNumber === log.vehicleHullNumber);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.logDate), 'dd MMM yyyy', { locale: localeID })}</TableCell>
                      <TableCell className="font-medium">{vehicle?.licensePlate || log.vehicleHullNumber}</TableCell>
                      <TableCell>{vehicle?.operator || 'N/A'}</TableCell>
                      <TableCell className="text-sm whitespace-pre-wrap">{log.partsUsed}</TableCell>
                      <TableCell>{log.loggedByName}</TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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
