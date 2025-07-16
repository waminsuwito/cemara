
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAppData } from '@/context/app-data-context';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Printer } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { DateRange } from "react-day-picker";

export default function RiwayatRitasiPage() {
  const { user } = useOperatorAuth();
  const { ritasiLogs } = useAppData();

  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 6)),
    to: endOfDay(new Date()),
  });

  const filteredRitasi = useMemo(() => {
    if (!user) return [];

    const fromDate = date?.from ? startOfDay(date.from) : null;
    const toDate = date?.to ? endOfDay(date.to) : null;

    return ritasiLogs
      .filter(log => {
        if (log.operatorId !== user.id) return false;

        if (fromDate && toDate) {
          const logDate = new Date(log.timestamp);
          if (isBefore(logDate, fromDate) || isAfter(logDate, toDate)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [ritasiLogs, user, date]);
  
  const printUrl = useMemo(() => {
    if (!date?.from || !date?.to) return '';
    const params = new URLSearchParams();
    params.set('from', date.from.toISOString());
    params.set('to', date.to.toISOString());
    return `/checklist/riwayat-ritasi/print?${params.toString()}`;
  }, [date]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Riwayat Ritasi Saya</CardTitle>
            <CardDescription>Catatan perjalanan ritasi yang telah Anda kirimkan.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "d MMM yyyy", { locale: localeID })} - {format(date.to, "d MMM yyyy", { locale: localeID })}
                      </>
                    ) : (
                      format(date.from, "d MMM yyyy")
                    )
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2}/>
              </PopoverContent>
            </Popover>
            <Button asChild disabled={!printUrl}>
              <Link href={printUrl}>
                <Printer className="mr-2 h-4 w-4" /> Cetak
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm font-medium mb-4">
          Total Ritasi: <span className="font-bold text-primary">{filteredRitasi.length}</span>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Asal</TableHead>
                <TableHead>Tujuan</TableHead>
                <TableHead>Berangkat</TableHead>
                <TableHead>Sampai</TableHead>
                <TableHead>Kembali</TableHead>
                <TableHead>Tiba di BP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRitasi.length > 0 ? (
                filteredRitasi.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>{format(new Date(log.timestamp), 'd MMM yyyy', { locale: localeID })}</TableCell>
                    <TableCell>{log.asal}</TableCell>
                    <TableCell>{log.tujuan}</TableCell>
                    <TableCell>{log.berangkat || '-'}</TableCell>
                    <TableCell>{log.sampai || '-'}</TableCell>
                    <TableCell>{log.kembali || '-'}</TableCell>
                    <TableCell>{log.tiba || '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">Tidak ada riwayat ritasi untuk rentang tanggal yang dipilih.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
