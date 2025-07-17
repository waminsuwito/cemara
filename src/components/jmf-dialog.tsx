
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppData } from '@/context/app-data-context';
import { JobMixFormula } from '@/lib/data';
import { Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

const jmfSchema = z.object({
  mutu: z.string().min(1, 'Mutu harus diisi'),
  pasir1: z.coerce.number().min(0, 'Nilai harus positif'),
  pasir2: z.coerce.number().min(0, 'Nilai harus positif'),
  batu1: z.coerce.number().min(0, 'Nilai harus positif'),
  batu2: z.coerce.number().min(0, 'Nilai harus positif'),
  semen1: z.coerce.number().min(0, 'Nilai harus positif'),
  semen2: z.coerce.number().min(0, 'Nilai harus positif'),
  air: z.coerce.number().min(0, 'Nilai harus positif'),
});

type JmfFormData = z.infer<typeof jmfSchema>;

export function JmfDialog({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (open: boolean) => void }) {
  const { jobMixFormulas, addJobMixFormula, updateJobMixFormula, deleteJobMixFormula } = useAppData();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<JmfFormData>({
    resolver: zodResolver(jmfSchema),
    defaultValues: {
      mutu: '',
      pasir1: 0,
      pasir2: 0,
      batu1: 0,
      batu2: 0,
      semen1: 0,
      semen2: 0,
      air: 0,
    },
  });

  const { register, handleSubmit, reset, setValue } = form;

  const handleEdit = (jmf: JobMixFormula) => {
    setEditingId(jmf.id);
    setValue('mutu', jmf.mutu);
    setValue('pasir1', jmf.pasir1);
    setValue('pasir2', jmf.pasir2);
    setValue('batu1', jmf.batu1);
    setValue('batu2', jmf.batu2);
    setValue('semen1', jmf.semen1);
    setValue('semen2', jmf.semen2);
    setValue('air', jmf.air);
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset();
  };

  const onSubmit = async (data: JmfFormData) => {
    try {
        if (editingId) {
            await updateJobMixFormula({ id: editingId, ...data });
        } else {
            await addJobMixFormula(data);
        }
        cancelEdit();
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Operasi Gagal",
            description: "Gagal menyimpan Job Mix Formula.",
        });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl text-white bg-gray-900 border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl">Job Mix Formula</DialogTitle>
          <DialogDescription>Kelola formula campuran untuk produksi beton.</DialogDescription>
        </DialogHeader>
        
        <div className="max-h-[60vh] overflow-y-auto pr-2">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-gray-800 border-b border-gray-700">
                        <TableHead className="text-white">MUTU</TableHead>
                        <TableHead className="text-white">PASIR 1</TableHead>
                        <TableHead className="text-white">PASIR 2</TableHead>
                        <TableHead className="text-white">BATU 1</TableHead>
                        <TableHead className="text-white">BATU 2</TableHead>
                        <TableHead className="text-white">SEMEN 1</TableHead>
                        <TableHead className="text-white">SEMEN 2</TableHead>
                        <TableHead className="text-white">AIR</TableHead>
                        <TableHead className="text-white text-right">AKSI</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobMixFormulas.map(jmf => (
                        <TableRow key={jmf.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <TableCell>{jmf.mutu}</TableCell>
                            <TableCell>{jmf.pasir1}</TableCell>
                            <TableCell>{jmf.pasir2}</TableCell>
                            <TableCell>{jmf.batu1}</TableCell>
                            <TableCell>{jmf.batu2}</TableCell>
                            <TableCell>{jmf.semen1}</TableCell>
                            <TableCell>{jmf.semen2}</TableCell>
                            <TableCell>{jmf.air}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(jmf)} className="text-yellow-400 hover:text-yellow-300">
                                    <Pencil className="h-4 w-4"/>
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80">
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus Formula Ini?</AlertDialogTitle>
                                            <AlertDialogDescription>Tindakan ini tidak dapat diurungkan.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteJobMixFormula(jmf.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
            <h4 className="text-lg font-semibold mb-4">{editingId ? 'Edit Formula' : 'Tambah Formula Baru'}</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Input placeholder="MUTU" {...register('mutu')} className="col-span-2 md:col-span-1 bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="PASIR 1" type="number" {...register('pasir1')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="PASIR 2" type="number" {...register('pasir2')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="BATU 1" type="number" {...register('batu1')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="BATU 2" type="number" {...register('batu2')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="SEMEN 1" type="number" {...register('semen1')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="SEMEN 2" type="number" {...register('semen2')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
                <Input placeholder="AIR" type="number" {...register('air')} className="bg-gray-700 border-gray-600 focus:ring-primary" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
                {editingId && <Button type="button" variant="secondary" onClick={cancelEdit}>Batal</Button>}
                <Button type="submit">{editingId ? 'Simpan Perubahan' : 'Simpan Job Mix'}</Button>
            </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
