"use client";

import React, { useMemo } from "react";
import { format, isSameDay, startOfToday } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { MechanicTask } from "@/lib/data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Re-using this component from other pages for consistency.
const CompletionStatusBadge = ({ targetDate, targetTime, completedAt }: { targetDate: string, targetTime: string, completedAt: number }) => {
    if (!targetDate || !targetTime || !completedAt) return null;

    const targetDateTime = new Date(`${targetDate}T${targetTime}`);
    const completedDateTime = new Date(completedAt);
    const diffMinutes = Math.round((completedDateTime.getTime() - targetDateTime.getTime()) / (60 * 1000));

    if (diffMinutes <= 5 && diffMinutes >= -5) { // Within 5 minutes buffer for on-time
        return <Badge className="mt-1 bg-yellow-400 text-yellow-900 hover:bg-yellow-500">Tepat Waktu</Badge>;
    }

    if (diffMinutes < -5) {
        const diffAbs = Math.abs(diffMinutes);
        const hours = Math.floor(diffAbs / 60);
        const minutes = diffAbs % 60;
        let text = 'Lebih Cepat';
        if (hours > 0) text += ` ${hours} jam`;
        if (minutes > 0) text += ` ${minutes} menit`;
        return <Badge className="mt-1 bg-green-400 text-green-900 hover:bg-green-500">{text}</Badge>;
    } else { // diffMinutes > 5
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        let text = 'Terlambat';
        if (hours > 0) text += ` ${hours} jam`;
        if (minutes > 0) text += ` ${minutes} menit`;
        return <Badge variant="destructive" className="mt-1">{text}</Badge>;
    }
}


export default function CompletedTasksPage() {
  const { user } = useAdminAuth();
  const { mechanicTasks, vehicles } = useAppData();

  const completedTodayTasks = useMemo(() => {
    const today = startOfToday();
    return mechanicTasks.filter(task => {
        // Filter 1: Must be completed
        if (task.status !== 'COMPLETED' || !task.completedAt) {
            return false;
        }

        // Filter 2: Must be completed today
        if (!isSameDay(new Date(task.completedAt), today)) {
            return false;
        }

        // Filter 3: Must be in the user's location (if applicable)
        const taskVehicle = task.vehicles?.[0];
        if (!taskVehicle) return false;

        const taskLocation = vehicles.find(v => v.hullNumber === taskVehicle.hullNumber)?.location;

        if (user?.role === 'SUPER_ADMIN') {
            return true; // Super admin sees all
        }

        if (user?.role === 'MEKANIK' && user.location) {
            return taskLocation === user.location;
        }

        return false;
    }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0)); // Sort by most recently completed
  }, [mechanicTasks, user, vehicles]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Realisasi Pekerjaan Hari Ini</CardTitle>
        <CardDescription>
            Daftar semua realisasi pekerjaan yang telah diselesaikan pada hari ini
            {user?.location && user.role !== 'SUPER_ADMIN' ? ` di lokasi ${user.location}.` : '.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
          <div className="border rounded-md">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[50%]">Detail Pekerjaan</TableHead>
                          <TableHead className="w-[25%]">Mekanik Bertugas</TableHead>
                          <TableHead>Waktu Selesai</TableHead>
                          <TableHead>Status Penyelesaian</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {completedTodayTasks.length > 0 ? completedTodayTasks.map(task => (
                          <TableRow key={task.id}>
                              <TableCell>
                                  {task.vehicles?.length > 0 ? (
                                  <ul className="space-y-3">
                                      {task.vehicles.map((v, i) => (
                                          <li key={i} className="border-l-2 border-primary pl-3">
                                              <p className="font-semibold">{v.licensePlate} <span className="text-muted-foreground font-normal">({v.hullNumber})</span></p>
                                              <p className="text-sm text-muted-foreground">&bull; {v.repairDescription}</p>
                                              <p className="text-sm text-muted-foreground">&bull; Target: {format(new Date(`${v.targetDate}T${v.targetTime}`), 'dd MMM, HH.mm', { locale: localeID })}</p>
                                          </li>
                                      ))}
                                  </ul>
                                  ) : ( 'N/A' )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                    {task.mechanics.map(m => <span key={m.id}>{m.name}</span>)}
                                </div>
                              </TableCell>
                              <TableCell>
                                  {task.completedAt ? format(new Date(task.completedAt), 'HH:mm', { locale: localeID }) : '-'}
                              </TableCell>
                              <TableCell>
                                {task.completedAt && task.vehicles?.[0] && <CompletionStatusBadge targetDate={task.vehicles[0].targetDate} targetTime={task.vehicles[0].targetTime} completedAt={task.completedAt} />}
                              </TableCell>
                          </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">Belum ada pekerjaan yang diselesaikan hari ini.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
      </CardContent>
    </Card>
  );
}
