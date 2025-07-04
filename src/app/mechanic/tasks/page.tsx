
"use client";

import React, { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { MechanicTask, User, Vehicle } from "@/lib/data";

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const taskFormSchema = z.object({
  vehicleHullNumber: z.string().min(1, "Kendaraan harus dipilih."),
  repairDescription: z.string().min(5, "Deskripsi perbaikan harus diisi (minimal 5 karakter)."),
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
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function MechanicTasksPage() {
  const { user } = useAdminAuth();
  const { vehicles, users, mechanicTasks, addMechanicTask, updateMechanicTask, deleteMechanicTask } = useAppData();
  const [isLoading, setIsLoading] = useState(false);

  const mechanics = useMemo(() => users.filter((u) => u.role === "MEKANIK" && (!user?.location || u.location === user.location)), [users, user]);
  const vehiclesForUser = useMemo(() => vehicles.filter(v => !user?.location || v.location === user.location), [vehicles, user]);
  const tasksForUser = useMemo(() => mechanicTasks.filter(t => vehiclesForUser.some(v => v.hullNumber === t.vehicleHullNumber)), [mechanicTasks, vehiclesForUser]);

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

  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    const taskPayload = {
      vehicleHullNumber: data.vehicleHullNumber,
      repairDescription: data.repairDescription,
      targetDate: format(data.targetDate, 'yyyy-MM-dd'),
      targetTime: data.targetTime,
      manpowerCount: data.mechanics.length,
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
    setIsLoading(false);
  };
  
  const handleStatusChange = (taskId: string, status: MechanicTask['status']) => {
    updateMechanicTask(taskId, { status });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Target Pekerjaan Hari Ini</CardTitle>
          <CardDescription>Tambah dan kelola target pekerjaan perbaikan alat untuk tim mekanik.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                
                <FormField
                  control={form.control}
                  name="vehicleHullNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kendaraan yang Dikerjakan</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Pilih Kendaraan" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vehiclesForUser.map((v) => (
                            <SelectItem key={v.id} value={v.hullNumber}>{v.licensePlate} ({v.hullNumber})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="repairDescription"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Perbaikan yang Dikerjakan</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Contoh: Ganti oli mesin dan periksa rem..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <Controller
                  control={form.control}
                  name="mechanics"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Man Power (Nama)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("justify-between", field.value.length === 0 && "text-muted-foreground")}>
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
              </div>

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
                            <TableHead>Kendaraan</TableHead>
                            <TableHead className="w-[35%]">Perbaikan</TableHead>
                            <TableHead>Target Selesai</TableHead>
                            <TableHead>Man Power</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tasksForUser.length > 0 ? tasksForUser.map(task => (
                            <TableRow key={task.id}>
                                <TableCell className="font-medium">{task.vehicleHullNumber}</TableCell>
                                <TableCell>{task.repairDescription}</TableCell>
                                <TableCell>{format(new Date(`${task.targetDate}T${task.targetTime}`), 'dd MMM yyyy, HH:mm')}</TableCell>
                                <TableCell>{task.mechanics.map(m => m.name).join(', ')} ({task.manpowerCount})</TableCell>
                                <TableCell>{getStatusBadge(task.status)}</TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Buka menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')} disabled={task.status === 'IN_PROGRESS'}>Tandai "Dikerjakan"</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'COMPLETED')} disabled={task.status === 'COMPLETED'}>Tandai "Selesai"</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'PENDING')} disabled={task.status === 'PENDING'}>Set "Menunggu"</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
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
                                <TableCell colSpan={6} className="h-24 text-center">Belum ada target pekerjaan yang dibuat.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
