
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
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import type { MechanicTask } from "@/lib/data";

const CompletionStatusBadge = ({ targetDate, targetTime, completedAt }: { targetDate: string, targetTime: string, completedAt: number }) => {
    if (!targetDate || !targetTime || !completedAt) return null;

    const targetDateTime = new Date(`${targetDate}T${targetTime}`);
    const completedDateTime = new Date(completedAt);
    const diffMinutes = Math.round((completedDateTime.getTime() - targetDateTime.getTime()) / (60 * 1000));

    if (diffMinutes <= 5 && diffMinutes >= -5) {
        return <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500">Tepat Waktu</Badge>;
    }

    if (diffMinutes < -5) {
        const diffAbs = Math.abs(diffMinutes);
        const hours = Math.floor(diffAbs / 60);
        const minutes = diffAbs % 60;
        let text = 'Lebih Cepat';
        if (hours > 0) text += ` ${hours} jam`;
        if (minutes > 0) text += ` ${minutes} menit`;
        return <Badge className="bg-green-400 text-green-900 hover:bg-green-500">{text}</Badge>;
    } else { // diffMinutes > 5
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        let text = 'Terlambat';
        if (hours > 0) text += ` ${hours} jam`;
        if (minutes > 0) text += ` ${minutes} menit`;
        return <Badge variant="destructive">{text}</Badge>;
    }
}

export default function RepairHistoryPage() {
  const { mechanicTasks, users, vehicles } = useAppData();
  const { user } = useAdminAuth();

  const [selectedOperatorId, setSelectedOperatorId] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const operators = useMemo(() => {
    const allOperators = users.filter(u => u.role === 'OPERATOR');

    if (user?.role === 'MEKANIK' && user.location) {
        return allOperators
            .filter(o => o.location === user.location)
            .sort((a,b) => a.name.localeCompare(b.name));
    }
    
    return allOperators.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, user]);

  const filteredTasks = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

    return mechanicTasks
      .filter((task) => {
        // Must be completed
        if (task.status !== 'COMPLETED' || !task.completedAt) return false;
        
        // Filter by user's location if mechanic
        if (user?.role === 'MEKANIK' && user.location) {
          const taskLocation = vehicles.find(v => v.hullNumber === task.vehicle?.hullNumber)?.location;
          if (taskLocation !== user.location) return false;
        }

        // Filter by date range
        if (fromDate && toDate) {
          const completedDate = new Date(task.completedAt);
          if (isBefore(completedDate, fromDate) || isAfter(completedDate, toDate)) {
            return false;
          }
        }
        
        // Filter by operator
        if (selectedOperatorId !== "all") {
            const operator = operators.find(o => o.id === selectedOperatorId);
            if (!operator) return false;

            const vehicleOperatorInTask = vehicles.find(vh => vh.hullNumber === task.vehicle.hullNumber)?.operator;
            if (vehicleOperatorInTask !== operator.name) {
                return false;
            }
        }
        
        return true;
      })
      .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)); // Sort by most recent first
  }, [mechanicTasks, date, selectedOperatorId, user, vehicles, operators]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histori Perbaikan Alat</CardTitle>
        <CardDescription>
          Tinjau riwayat pekerjaan perbaikan yang telah diselesaikan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2 items-start md:items-center">
          <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
            <SelectTrigger className="md:w-[250px]">
              <SelectValue placeholder="Pilih Operator/Driver" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Operator</SelectItem>
              {operators.map((operator) => (
                <SelectItem key={operator.id} value={operator.id}>
                  {operator.name}
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
                <TableHead className="w-[45%]">Detail Pekerjaan</TableHead>
                <TableHead>Mekanik Bertugas</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Status Penyelesaian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      {task.vehicle ? (
                        <div className="border-l-2 border-primary pl-3">
                          <p className="font-semibold">{task.vehicle.licensePlate} <span className="text-muted-foreground font-normal">({task.vehicle.hullNumber})</span></p>
                          <p className="text-sm text-muted-foreground">&bull; Operator: {vehicles.find(vh => vh.hullNumber === task.vehicle.hullNumber)?.operator || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">&bull; Perbaikan: {task.vehicle.repairDescription}</p>
                        </div>
                      ) : ( 'N/A' )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                          {task.mechanics.map(m => <span key={m.id}>{m.name}</span>)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.completedAt ? format(new Date(task.completedAt), 'dd MMM yyyy, HH:mm', { locale: localeID }) : '-'}
                    </TableCell>
                    <TableCell>
                      {task.completedAt && task.vehicle && <CompletionStatusBadge targetDate={task.vehicle.targetDate} targetTime={task.vehicle.targetTime} completedAt={task.completedAt} />}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Tidak ada riwayat perbaikan ditemukan untuk filter yang dipilih.
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
