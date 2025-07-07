
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Printer, Trash2 } from "lucide-react";

import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { MechanicTask } from "@/lib/data";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";


const getStatusBadge = (status: MechanicTask['status']) => {
  switch (status) {
    case "PENDING":
      return <Badge variant="secondary" className="bg-gray-400 text-gray-900">Menunggu</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">Dikerjakan</Badge>;
    case "COMPLETED":
      return <Badge variant="secondary" className="bg-green-400 text-green-900">Selesai</Badge>;
    case "DELAYED":
      return <Badge variant="secondary" className="bg-orange-400 text-orange-900">Tertunda</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

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


export default function MechanicActivityPage() {
  const { user } = useAdminAuth();
  const { mechanicTasks, vehicles, locationNames, deleteMechanicTask } = useAppData();
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [locationFilter, setLocationFilter] = useState(
    isSuperAdmin ? "all" : user?.location || "all"
  );
  
  const filteredTasks = useMemo(() => {
    return mechanicTasks.filter(task => {
        if (!isSuperAdmin && !user?.location) return false;
        
        const taskLocation = vehicles.find(v => v.hullNumber === task.vehicle?.hullNumber)?.location;

        if(isSuperAdmin) {
            if (locationFilter === 'all') return true;
            return taskLocation === locationFilter;
        }

        // For location admin
        return taskLocation === user?.location;

    }).sort((a,b) => b.createdAt - a.createdAt);
  }, [mechanicTasks, locationFilter, isSuperAdmin, user, vehicles]);

  const printUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('location', locationFilter);
    return `/admin/mechanic-activity/print?${params.toString()}`;
  }, [locationFilter]);


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Monitoring Kegiatan Mekanik</CardTitle>
            <CardDescription>Lihat semua target pekerjaan yang ditugaskan kepada tim mekanik.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href={printUrl}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Laporan
                </Link>
            </Button>
            {isSuperAdmin && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Lokasi" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Semua Lokasi</SelectItem>
                    {locationNames.map((location) => (
                    <SelectItem key={location} value={location}>
                        {location}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            )}
        </div>
      </CardHeader>
      <CardContent>
          <div className="border rounded-md">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[50%]">Detail Pekerjaan</TableHead>
                          <TableHead className="w-[25%]">Mekanik Bertugas</TableHead>
                          <TableHead>Dibuat Pada</TableHead>
                          <TableHead>Status</TableHead>
                          {isSuperAdmin && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredTasks.length > 0 ? filteredTasks.map(task => (
                          <TableRow key={task.id}>
                              <TableCell>
                                  {task.vehicle ? (
                                    <div className="border-l-2 border-primary pl-3">
                                        <p className="font-semibold">{task.vehicle.licensePlate} <span className="text-muted-foreground font-normal">({task.vehicle.hullNumber})</span></p>
                                        <p className="text-sm text-muted-foreground">&bull; {task.vehicle.repairDescription}</p>
                                        <p className="text-sm text-muted-foreground">&bull; Target Selesai: {format(new Date(`${task.vehicle.targetDate}T${task.vehicle.targetTime}`), 'dd MMM yyyy, HH.mm', { locale: localeID })}</p>
                                        {task.startedAt && <p className="text-sm text-muted-foreground">&bull; Mulai: {format(new Date(task.startedAt), 'dd MMM yyyy, HH.mm', { locale: localeID })}</p>}
                                        {task.completedAt && <p className="text-sm text-muted-foreground">&bull; Selesai: {format(new Date(task.completedAt), 'dd MMM yyyy, HH.mm', { locale: localeID })}</p>}
                                        {task.status === 'COMPLETED' && task.completedAt && <div className="mt-1"><CompletionStatusBadge targetDate={task.vehicle.targetDate} targetTime={task.vehicle.targetTime} completedAt={task.completedAt} /></div>}
                                        {task.status === 'DELAYED' && task.delayReason && <p className="text-sm text-orange-500 italic mt-1">&bull; Alasan Tertunda: {task.delayReason}</p>}
                                    </div>
                                  ) : ( 'N/A' )}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                    {task.mechanics.map(m => <span key={m.id}>{m.name}</span>)}
                                </div>
                              </TableCell>
                              <TableCell>
                                  {format(new Date(task.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeID })}
                              </TableCell>
                              <TableCell>
                                {task.status === 'DELAYED' && task.delayReason ? (
                                    <Dialog>
                                    <DialogTrigger asChild>
                                        <span className="cursor-pointer">{getStatusBadge(task.status)}</span>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                        <DialogTitle>Alasan Penundaan untuk {task.vehicle?.licensePlate}</DialogTitle>
                                        <DialogDescription>
                                            Pekerjaan ini ditunda karena alasan berikut:
                                        </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4 text-sm">
                                        {task.delayReason}
                                        </div>
                                    </DialogContent>
                                    </Dialog>
                                ) : (
                                    getStatusBadge(task.status)
                                )}
                              </TableCell>
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
                                                <AlertDialogTitle>Hapus Kegiatan Ini?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Tindakan ini akan menghapus data kegiatan mekanik ini secara permanen.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteMechanicTask(task.id)} className="bg-destructive hover:bg-destructive/90">
                                                    Hapus
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                              )}
                          </TableRow>
                      )) : (
                          <TableRow>
                              <TableCell colSpan={isSuperAdmin ? 5 : 4} className="h-24 text-center">Tidak ada kegiatan yang ditemukan untuk filter yang dipilih.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
          </div>
      </CardContent>
    </Card>
  );
}
