
"use client";

import React, { useMemo } from "react";
import { format, isSameDay, startOfToday } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { MechanicTask, Report } from "@/lib/data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

const OriginalReportDetails = ({ report }: { report: Report | undefined }) => {
    if (!report) return null;
    
    const problemItems = report.items?.filter(item => item.status !== 'BAIK') || [];
    const otherDamage = report.kerusakanLain;

    if (problemItems.length === 0 && !otherDamage?.keterangan) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-t border-dashed">
            <h4 className="text-xs font-semibold text-muted-foreground mb-1">Laporan Awal Sopir:</h4>
            <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-1">
                {problemItems.map(item => (
                    <li key={item.id}>
                        <strong>{item.label} ({item.status}):</strong> {item.keterangan || 'Tidak ada keterangan.'}
                        {item.foto && (
                             <a href={item.foto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">[Lihat Foto]</a>
                        )}
                    </li>
                ))}
                {otherDamage?.keterangan && (
                     <li>
                        <strong>Kerusakan Lainnya:</strong> {otherDamage.keterangan}
                        {otherDamage.foto && (
                             <a href={otherDamage.foto} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-2">[Lihat Foto]</a>
                        )}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default function RepairsPage() {
  const { user } = useAdminAuth();
  const { mechanicTasks, vehicles, reports } = useAppData();

  const completedTodayTasks = useMemo(() => {
    const today = startOfToday();
    return mechanicTasks.filter(task => {
        if (task.status !== 'COMPLETED' || !task.completedAt) {
            return false;
        }

        if (!isSameDay(new Date(task.completedAt), today)) {
            return false;
        }

        const taskVehicle = task.vehicle;
        if (!taskVehicle) return false;

        const taskLocation = vehicles.find(v => v.hullNumber === taskVehicle.hullNumber)?.location;

        if (user?.role === 'SUPER_ADMIN') {
            return true;
        }

        if ((user?.role === 'LOGISTIK' || user?.role === 'MEKANIK') && user.location) {
            return taskLocation === user.location;
        }

        return false;
    }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [mechanicTasks, user, vehicles]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Perbaikan Hari Ini</CardTitle>
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
                      {completedTodayTasks.length > 0 ? completedTodayTasks.map(task => {
                        const originalReport = reports.find(r => r.id === task.vehicle.triggeringReportId);
                        
                        return (
                          <TableRow key={task.id}>
                              <TableCell className="align-top">
                                  {task.vehicle ? (
                                      <div>
                                        <div className="font-semibold">{task.vehicle.licensePlate} <span className="text-muted-foreground font-normal">({task.vehicle.hullNumber})</span></div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          <span className="font-medium text-foreground">Deskripsi Perbaikan (WO):</span> {task.vehicle.repairDescription}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          <span className="font-medium text-foreground">Target Selesai:</span> {format(new Date(`${task.vehicle.targetDate}T${task.vehicle.targetTime}`), 'dd MMM yyyy, HH.mm', { locale: localeID })}
                                        </div>
                                        <OriginalReportDetails report={originalReport} />
                                      </div>
                                  ) : ( 'N/A' )}
                              </TableCell>
                              <TableCell className="align-top">
                                <div className="flex flex-col gap-1">
                                    {task.mechanics.map(m => <span key={m.id}>{m.name}</span>)}
                                </div>
                              </TableCell>
                              <TableCell className="align-top">
                                  {task.completedAt ? format(new Date(task.completedAt), 'HH:mm', { locale: localeID }) : '-'}
                              </TableCell>
                              <TableCell className="align-top">
                                {task.completedAt && task.vehicle && <CompletionStatusBadge targetDate={task.vehicle.targetDate} targetTime={task.vehicle.targetTime} completedAt={task.completedAt} />}
                              </TableCell>
                          </TableRow>
                        )
                      }) : (
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
