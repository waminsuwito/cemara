
"use client";

import React, { useMemo, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { MechanicTask } from "@/lib/data";

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
  vehicles: z.array(z.object({
    hullNumber: z.string(),
    licensePlate: z.string(),
    repairDescription: z.string().min(5, "Deskripsi perbaikan harus diisi."),
    targetDate: z.date({ required_error: "Tanggal target harus diisi." }),
    targetTime: z.string().min(1, "Waktu target harus diisi."),
  })).min(1, "Pilih minimal satu kendaraan."),
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
  const [selectedVehicleToAdd, setSelectedVehicleToAdd] = useState("");

  const mechanics = useMemo(() => users.filter((u) => u.role === "MEKANIK" && (!user?.location || u.location === user.location)), [users, user]);
  const vehiclesForUser = useMemo(() => vehicles.filter(v => !user?.location || v.location === user.location), [vehicles, user]);

  const tasksForUser = useMemo(() => {
    return mechanicTasks.filter(task => 
        task.vehicles?.some(taskVehicle => 
            vehiclesForUser.some(userVehicle => userVehicle.hullNumber === taskVehicle.hullNumber)
        )
    ).sort((a,b) => b.createdAt - a.createdAt);
  }, [mechanicTasks, vehiclesForUser]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      vehicles: [],
      mechanics: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  const handleAddVehicle = () => {
    if (!selectedVehicleToAdd) return;
    const vehicle = vehiclesForUser.find(v => v.hullNumber === selectedVehicleToAdd);
    if (vehicle) {
      if (!fields.some(v => v.hullNumber === vehicle.hullNumber)) {
        append({ 
          hullNumber: vehicle.hullNumber, 
          licensePlate: vehicle.licensePlate,
          repairDescription: "",
          targetDate: new Date(),
          targetTime: ""
        });
      }
    }
    setSelectedVehicleToAdd(""); // Reset select
  };


  const onSubmit = async (data: TaskFormData) => {
    setIsLoading(true);
    const taskPayload = {
      vehicles: data.vehicles.map(v => ({
        ...v,
        targetDate: format(v.targetDate, 'yyyy-MM-dd'),
      })),
      manpowerCount: data.mechanics.length,
      mechanics: data.mechanics,
    };
    await addMechanicTask(taskPayload);
    form.reset({
      vehicles: [],
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
                
              <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vehicles"
                    render={() => (
                      <FormItem>
                        <FormLabel>Kendaraan & Perbaikan yang Dikerjakan</FormLabel>
                        <div className="flex items-center gap-2">
                            <Select onValueChange={setSelectedVehicleToAdd} value={selectedVehicleToAdd}>
                                <SelectTrigger><SelectValue placeholder="Pilih Kendaraan" /></SelectTrigger>
                                <SelectContent>
                                {vehiclesForUser.map((v) => (
                                    <SelectItem key={v.id} value={v.hullNumber} disabled={fields.some(sv => sv.hullNumber === v.hullNumber)}>
                                        {v.licensePlate} ({v.hullNumber})
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <Button type="button" onClick={handleAddVehicle} variant="outline" size="sm">Pilih</Button>
                        </div>
                        <FormMessage />

                        <div className="space-y-4 pt-2">
                          {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border rounded-lg bg-muted/20 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="font-medium">
                                  <p>{field.licensePlate}</p>
                                  <p className="text-xs text-muted-foreground">{field.hullNumber}</p>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Hapus Kendaraan</span>
                                </Button>
                              </div>
                              
                              <FormField
                                  control={form.control}
                                  name={`vehicles.${index}.repairDescription`}
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
                                  name={`vehicles.${index}.targetDate`}
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
                                  name={`vehicles.${index}.targetTime`}
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
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
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
                                    {task.vehicles?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {task.vehicles.map((v, i) => (
                                            <li key={i} className="border-l-2 border-primary pl-3">
                                                <p className="font-semibold">{v.licensePlate} <span className="text-muted-foreground font-normal">({v.hullNumber})</span></p>
                                                <p className="text-sm text-muted-foreground">&bull; {v.repairDescription}</p>
                                                <p className="text-sm text-muted-foreground">&bull; Target: {format(new Date(`${v.targetDate}T${v.targetTime}`), 'dd MMM yyyy, HH:mm', { locale: localeID })}</p>
                                            </li>
                                        ))}
                                    </ul>
                                    ) : ( 'N/A' )}
                                </TableCell>
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
                                <TableCell colSpan={4} className="h-24 text-center">Belum ada target pekerjaan yang dibuat.</TableCell>
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
