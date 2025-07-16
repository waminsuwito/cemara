
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

export default function SparePartsHistoryPage() {
  const { sparePartLogs, vehicles, users } = useAppData();
  const { user } = useAdminAuth();

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const vehiclesForUser = useMemo(() => {
    if (user?.role === 'SUPER_ADMIN') return vehicles;
    if (user?.location) {
        return vehicles.filter(v => v.location === user.location);
    }
    return [];
  }, [vehicles, user]);

  const filteredLogs = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

    return sparePartLogs
      .filter((log) => {
        // Filter by selected vehicle
        if (selectedVehicleId !== "all" && log.vehicleHullNumber !== selectedVehicleId) {
          return false;
        }
        
        // Filter by user's accessible vehicles
        if (!vehiclesForUser.some(v => v.hullNumber === log.vehicleHullNumber)) {
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
  }, [sparePartLogs, selectedVehicleId, date, vehiclesForUser]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penggunaan Spare Part</CardTitle>
        <CardDescription>
          Tinjau riwayat penggunaan suku cadang untuk perbaikan alat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
            <SelectTrigger className="md:w-[250px]">
              <SelectValue placeholder="Pilih Alat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Alat</SelectItem>
              {vehiclesForUser.map((vehicle) => (
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
                  const operatorUser = users.find(u => u.batangan?.includes(vehicle?.licensePlate || ''));
                  return (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.logDate), 'dd MMM yyyy', { locale: localeID })}</TableCell>
                      <TableCell className="font-medium">{vehicle?.licensePlate || log.vehicleHullNumber}</TableCell>
                      <TableCell>{operatorUser?.name || 'N/A'}</TableCell>
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
