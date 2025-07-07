
"use client";

import React, { useState, useMemo } from "react";
import { format, isSameDay, startOfToday } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import type { MechanicTask } from "@/lib/data";

const sparePartFormSchema = z.object({
  partsUsed: z.string().min(3, { message: "Mohon isi spare part yang digunakan." }),
});
type SparePartFormData = z.infer<typeof sparePartFormSchema>;

const SparePartFormDialog = ({ task, isOpen, setIsOpen }: {
  task: MechanicTask,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void
}) => {
  const { addSparePartLog } = useAppData();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SparePartFormData>({
    resolver: zodResolver(sparePartFormSchema),
    defaultValues: { partsUsed: "" },
  });

  const onSubmit = async (data: SparePartFormData) => {
    setIsSubmitting(true);
    await addSparePartLog({
      taskId: task.id,
      vehicleHullNumber: task.vehicle.hullNumber,
      partsUsed: data.partsUsed,
    });
    setIsSubmitting(false);
    setIsOpen(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Input Spare Part untuk {task.vehicle.licensePlate}</DialogTitle>
          <DialogDescription>
            Masukkan daftar suku cadang yang digunakan untuk perbaikan ini.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="partsUsed"
              render={({ field }) => (
                <FormItem>
                  <Textarea {...field} rows={5} placeholder="Contoh:&#10;- Kampas Rem Depan (2 buah)&#10;- Oli Mesin (4 liter)" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default function SparePartsPage() {
  const { user } = useAdminAuth();
  const { mechanicTasks, vehicles, sparePartLogs } = useAppData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<MechanicTask | null>(null);

  const completedTodayTasks = useMemo(() => {
    const today = startOfToday();
    return mechanicTasks.filter(task => {
      if (task.status !== 'COMPLETED' || !task.completedAt || !isSameDay(new Date(task.completedAt), today)) {
        return false;
      }
      const taskLocation = vehicles.find(v => v.hullNumber === task.vehicle?.hullNumber)?.location;
      if (user?.role === 'SUPER_ADMIN') return true;
      if ((user?.role === 'LOGISTIK' || user?.role === 'MEKANIK') && user.location) {
        return taskLocation === user.location;
      }
      return false;
    }).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  }, [mechanicTasks, user, vehicles]);

  const handleOpenDialog = (task: MechanicTask) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Digunakan Hari Ini</CardTitle>
          <CardDescription>
            Pilih pekerjaan yang telah selesai untuk menginput data penggunaan spare part.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kendaraan</TableHead>
                  <TableHead className="w-[40%]">Deskripsi Perbaikan</TableHead>
                  <TableHead>Suku Cadang Digunakan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedTodayTasks.length > 0 ? completedTodayTasks.map(task => {
                  const log = sparePartLogs.find(l => l.taskId === task.id);
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {task.vehicle.licensePlate}
                        <div className="text-xs text-muted-foreground">{task.vehicle.hullNumber}</div>
                      </TableCell>
                      <TableCell>{task.vehicle.repairDescription}</TableCell>
                      <TableCell>
                        {log ? (
                          <div className="text-xs whitespace-pre-wrap">{log.partsUsed}</div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum diinput</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={log ? "secondary" : "default"}
                          size="sm"
                          onClick={() => handleOpenDialog(task)}
                          disabled={!!log}
                        >
                          {log ? "Sudah Diinput" : "Input"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                }) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Belum ada pekerjaan yang diselesaikan hari ini.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selectedTask && (
        <SparePartFormDialog
          task={selectedTask}
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
        />
      )}
    </>
  );
}
