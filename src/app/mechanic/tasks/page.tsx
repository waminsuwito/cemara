
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isSameDay, isBefore, startOfToday } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { MechanicTask, Vehicle, Report } from "@/lib/data";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DialogContent } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

const taskFormSchema = z.object({
  vehicleHullNumber: z.string().min(1, "Kendaraan harus dipilih."),
  repairDescription: z.string().min(5, "Deskripsi perbaikan harus diisi."),
  targetDate: z.date({ required_error: "Tanggal target harus diisi." }),
  targetTime: z.string().min(1, "Waktu target harus diisi."),
  mechanics: z.array(z.object({ id: z.string(), name: z.string() })).min(1, "Pilih minimal satu mekanik."),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

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

type VehicleWithStatus = Vehicle & { status: string; latestReport?: Report };

export default function MechanicTasksPage() {
  const { user } = useAdminAuth();
  const { vehicles, users, mechanicTasks, reports, addMechanicTask, updateMechanicTask, deleteMechanicTask } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [damageDetails, setDamageDetails] = useState("");
  const [damagePhotoUrl, setDamagePhotoUrl] = useState("");
  const [isDelayDialogOpen, setIsDelayDialogOpen] = useState(false);
  const [selectedTaskForDelay, setSelectedTaskForDelay] = useState<MechanicTask | null>(null);
  const [delayReasonInput, setDelayReasonInput] = useState("");

  const mechanics = useMemo(() => users.filter((u) => u.role === "MEKANIK" && (!user?.location || u.location === user.location)), [users, user]);
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      vehicleHullNumber: "",
      repairDescription: "",
      targetDate: new Date(),
      targetTime: "",
      mechanics: [],
    },
  });

  const { watch } = form;
  const selectedVehicleHullNumber = watch("vehicleHullNumber");

  const vehiclesWithStatus = useMemo(() => {
    const today = startOfToday();
    return vehicles.map((vehicle): VehicleWithStatus => {
      const reportsForVehicle = reports
        .filter(r => r.vehicleId === vehicle.hullNumber)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      const latestReport = reportsForVehicle[0];
      let status = 'Belum Checklist';

      if (latestReport) {
        const reportDate = new Date(latestReport.timestamp);
        if (isSameDay(reportDate, today)) {
          status = latestReport.overallStatus;
        } else if (isBefore(reportDate, today)) {
          if (latestReport.overallStatus === 'Rusak' || latestReport.overallStatus === 'Perlu Perhatian') {
            status = latestReport.overallStatus;
          }
        }
      }
      
      return { ...vehicle, status, latestReport };
    });
  }, [vehicles, reports]);

  const vehiclesForUser = useMemo(() => vehicles.filter(v => !user?.location || v.location === user.location), [vehicles, user]);
  
  const damagedOrAttentionVehicles = useMemo(() => {
    const vehiclesInLocation = vehiclesWithStatus.filter(v => !user?.location || v.location === user.location);
    return vehiclesInLocation.filter(v => v.status === 'Rusak' || v.status === 'Perlu Perhatian');
  }, [vehiclesWithStatus, user]);


  const tasksForUser = useMemo(() => {
    return mechanicTasks.filter(task => 
        task.vehicle && vehiclesForUser.some(userVehicle => userVehicle.hullNumber === task.vehicle.hullNumber)
    ).sort((a,b) => b.createdAt - a.createdAt);
  }, [mechanicTasks, vehiclesForUser]);

  useEffect(() => {
    if (selectedVehicleHullNumber) {
        const vehicle = damagedOrAttentionVehicles.find(v => v.hullNumber === selectedVehicleHullNumber);
        
        if (vehicle && vehicle.latestReport) {
            const report = vehicle.latestReport;
            const problemItems = report.items
                ?.filter(item => item.status !== 'BAIK')
                .map(item => `- ${item.label} (${item.status}): ${item.keterangan || 'Tidak ada keterangan.'}`)
                .join('\n') || '';

            const otherDamage = report.kerusakanLain?.keterangan 
                ? `- Kerusakan Lainnya: ${report.kerusakanLain.keterangan}` 
                : '';
            
            const fullDescription = [problemItems, otherDamage].filter(Boolean).join('\n');
            setDamageDetails(fullDescription.trim() || "Tidak ada detail kerusakan spesifik dari laporan operator.");

            const problemItemWithPhoto = report.items?.find(item => item.status !== 'BAIK' && item.foto);
            const otherDamagePhoto = report.kerusakanLain?.foto;
            setDamagePhotoUrl(problemItemWithPhoto?.foto || otherDamagePhoto || "");
        } else {
            setDamageDetails("");
            setDamagePhotoUrl("");
        }
    } else {
        setDamageDetails("");
        setDamagePhotoUrl("");
    }
  }, [selectedVehicleHullNumber, damagedOrAttentionVehicles]);

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    const vehicle = damagedOrAttentionVehicles.find(v => v.hullNumber === data.vehicleHullNumber);
    if (!vehicle) {
        toast({
            variant: 'destructive',
            title: 'Gagal Menyimpan',
            description: 'Kendaraan yang dipilih tidak valid atau tidak ditemukan.'
        })
        setIsLoading(false);
        return;
    }

    const taskPayload = {
      vehicle: {
        hullNumber: vehicle.hullNumber,
        licensePlate: vehicle.licensePlate,
        repairDescription: data.repairDescription,
        targetDate: format(data.targetDate, 'yyyy-MM-dd'),
        targetTime: data.targetTime,
        triggeringReportId: vehicle.latestReport?.id,
      },
      mechanics: data.mechanics,
    };
    await addMechanicTask(taskPayload);
    form.reset({
      vehicleHullNumber: "",
      repairDescription: "",
      targetDate: new Date(),
      targetTime: "",
      mechanics: [],
    });
    setDamageDetails("");
    setDamagePhotoUrl("");
    setIsLoading(false);
  };
  
  const handleStatusChange = (taskId: string, status: MechanicTask['status']) => {
    const payload: Partial<MechanicTask> = { status };
    if (status !== 'DELAYED') {
      payload.delayReason = ""; // Clear delay reason if status changes to something else
    }
    updateMechanicTask(taskId, payload);
  };

  const handleConfirmDelay = () => {
      if (!selectedTaskForDelay) return;
      if (delayReasonInput.trim().length < 5) {
        toast({ variant: 'destructive', title: 'Alasan terlalu pendek', description: 'Mohon berikan alasan penundaan yang jelas.' });
        return;
      }
      updateMechanicTask(selectedTaskForDelay.id, { status: 'DELAYED', delayReason: delayReasonInput.trim() });
      setIsDelayDialogOpen(false);
      setSelectedTaskForDelay(null);
      setDelayReasonInput("");
    };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Work Order (WO) Saya Hari Ini</CardTitle>
          <CardDescription>Tambah dan kelola Work Order (WO) perbaikan alat untuk tim mekanik.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="p-4 border rounded-lg bg-muted/20 space-y-4">
                <FormField
                  control={form.control}
                  name="vehicleHullNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pilih Kendaraan & Perbaikan</FormLabel>
                       <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Pilih Kendaraan Bermasalah" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {damagedOrAttentionVehicles.length > 0 ? (
                            damagedOrAttentionVehicles.map((v) => (
                                <SelectItem key={v.id} value={v.hullNumber}>
                                    {v.licensePlate} ({v.hullNumber}) - {v.status}
                                </SelectItem>
                            ))
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada alat yang perlu perbaikan.</div>
                          )}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {damageDetails && (
                  <div className="space-y-2">
                    <Label>Deskripsi Kerusakan dari Sopir/Operator</Label>
                    <Textarea
                      readOnly
                      value={damageDetails}
                      className="bg-muted/40 border-dashed h-auto resize-none focus-visible:ring-0"
                      rows={damageDetails.split('\n').length > 1 ? damageDetails.split('\n').length : 2}
                    />
                     {damagePhotoUrl && (
                        <div className="mt-2">
                            <p className="text-sm text-muted-foreground mb-1">Foto dari Laporan:</p>
                            <a href={damagePhotoUrl} target="_blank" rel="noopener noreferrer">
                                <img src={damagePhotoUrl} alt="Foto Laporan Kerusakan" className="rounded-md w-full max-w-xs cursor-pointer hover:opacity-90 transition-opacity" data-ai-hint="machine damage" />
                            </a>
                        </div>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="repairDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi Perbaikan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contoh: Ganti oli mesin, periksa rem..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Target Selesai (Tanggal)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP", { locale: localeID }) : <span>Pilih tanggal</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    <FormField
                    control={form.control}
                    name="targetTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Selesai (Waktu)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Controller
                control={form.control}
                name="mechanics"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Man Power (Nama Mekanik)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("justify-between w-full", field.value.length === 0 && "text-muted-foreground")}>
                            <span className="truncate">
                              {field.value.length > 0
                                ? field.value.map((m) => m.name).join(", ")
                                : "Pilih Mekanik"}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Cari mekanik..." />
                          <CommandList>
                            <CommandEmpty>Mekanik tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {mechanics.map((mechanic) => (
                                <CommandItem
                                  value={mechanic.name}
                                  key={mechanic.id}
                                  onSelect={() => {
                                    const isSelected = field.value.some((m) => m.id === mechanic.id);
                                    if (isSelected) {
                                      field.onChange(field.value.filter((m) => m.id !== mechanic.id));
                                    } else {
                                      field.onChange([...field.value, { id: mechanic.id, name: mechanic.name }]);
                                    }
                                  }}
                                >
                                  <Check className={cn("mr-2 h-4 w-4", field.value.some((m) => m.id === mechanic.id) ? "opacity-100" : "opacity-0")} />
                                  {mechanic.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                      <div className="text-sm text-muted-foreground pt-1">
                        Jumlah Man Power: {field.value.length}
                      </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Tambah Target
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Daftar Target Pekerjaan</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Detail Target Pekerjaan</TableHead>
                            <TableHead>Man Power</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasksForUser.length > 0 ? tasksForUser.map(task => (
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
                                <TableCell>{task.mechanics.map(m => m.name).join(', ')}</TableCell>
                                <TableCell>{getStatusBadge(task.status)}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={task.status === 'COMPLETED'}>
                                        <span className="sr-only">Buka menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')} disabled={task.status === 'IN_PROGRESS' || task.status === 'COMPLETED'}>Tandai "Dikerjakan"</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'COMPLETED')} disabled={task.status === 'COMPLETED'}>Tandai "Selesai"</DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={() => {
                                          setSelectedTaskForDelay(task);
                                          setDelayReasonInput(task.delayReason || "");
                                          setIsDelayDialogOpen(true);
                                        }} 
                                        disabled={task.status === 'COMPLETED'}
                                      >
                                        Set "Tertunda"
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'PENDING')} disabled={task.status === 'PENDING' || task.status === 'IN_PROGRESS' || task.status === 'COMPLETED'}>Set "Menunggu"</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive" disabled={task.status === 'COMPLETED'}>
                                            Hapus
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Target Pekerjaan?</AlertDialogTitle>
                                            <AlertDialogDescription>Tindakan ini tidak dapat diurungkan. Ini akan menghapus data pekerjaan secara permanen.</AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteMechanicTask(task.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Belum ada target pekerjaan yang dibuat.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
      
      <Dialog open={isDelayDialogOpen} onOpenChange={setIsDelayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alasan Penundaan untuk {selectedTaskForDelay?.vehicle.licensePlate}</DialogTitle>
            <DialogDescription>
              Jelaskan mengapa pekerjaan ini ditunda. Keterangan ini akan disimpan dalam riwayat.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Contoh: Menunggu spare part rem tiba..."
              value={delayReasonInput}
              onChange={(e) => setDelayReasonInput(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDelayDialogOpen(false)}>Batal</Button>
            <Button onClick={handleConfirmDelay}>Simpan Alasan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
