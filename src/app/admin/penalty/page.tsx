
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function PenaltyHistoryPage() {
  const { penalties, users, locationNames, deletePenalty } = useAppData();
  const { user: adminUser } = useAdminAuth();
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';

  const [locationFilter, setLocationFilter] = useState(
    isSuperAdmin ? "all" : adminUser?.location || "all"
  );
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const filteredPenalties = useMemo(() => {
    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

    return penalties
      .filter((penalty) => {
        const penaltyUser = users.find(u => u.id === penalty.userId);
        if (!penaltyUser) return false;

        // Filter by location
        if (locationFilter !== "all" && penaltyUser.location !== locationFilter) {
          return false;
        }

        // Location Admin can only see their location
        if (!isSuperAdmin && penaltyUser.location !== adminUser?.location) {
          return false;
        }

        // Filter by date range
        if (fromDate && toDate) {
          const penaltyDate = new Date(penalty.timestamp);
          if (isBefore(penaltyDate, fromDate) || isAfter(penaltyDate, toDate)) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
  }, [penalties, users, locationFilter, date, isSuperAdmin, adminUser]);

  const printUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('location', locationFilter);
    if (date?.from) params.set('from', date.from.toISOString());
    if (date?.to) params.set('to', date.to.toISOString());
    return params.toString();
  }, [locationFilter, date]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat Penalti</CardTitle>
        <CardDescription>
          Tinjau semua riwayat penalti yang telah diberikan kepada pengguna.
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
            <Link href={`/admin/penalty/print?${printUrl}`}>
                <Printer className="mr-2 h-4 w-4" />
                Cetak Riwayat
            </Link>
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Nama Penerima</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Penalty</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Diberikan Oleh</TableHead>
                {isSuperAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPenalties.length > 0 ? (
                filteredPenalties.map((penalty) => {
                  const user = users.find(u => u.id === penalty.userId);
                  return (
                    <TableRow key={penalty.id}>
                      <TableCell>{format(new Date(penalty.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                      <TableCell className="font-medium">{penalty.userName} <div className="text-xs text-muted-foreground">{penalty.userNik}</div></TableCell>
                      <TableCell>{user?.role || 'N/A'}</TableCell>
                      <TableCell>{penalty.vehicleHullNumber}</TableCell>
                      <TableCell className="font-bold text-destructive text-center">{penalty.points}</TableCell>
                      <TableCell>{penalty.reason}</TableCell>
                      <TableCell>{penalty.givenByAdminUsername}</TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Hapus Penalti Ini?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Tindakan ini akan menghapus data penalti secara permanen.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deletePenalty(penalty.id)} className="bg-destructive hover:bg-destructive/90">
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
                  <TableCell colSpan={isSuperAdmin ? 8 : 7} className="h-24 text-center">
                    Tidak ada data penalti untuk filter yang dipilih.
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
