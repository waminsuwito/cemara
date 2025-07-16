
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAppData } from '@/context/app-data-context';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ritasiFormSchema = z.object({
  asal: z.string().min(1, 'Asal harus dipilih.'),
  tujuan: z.string().min(1, 'Tujuan harus diisi.'),
  berangkat: z.string().optional(),
  sampai: z.string().optional(),
  kembali: z.string().optional(),
  tiba: z.string().optional(),
});

type RitasiFormData = z.infer<typeof ritasiFormSchema>;

export default function RitasiPage() {
  const { locationNames, addRitasi } = useAppData();
  const { user, vehicle } = useOperatorAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RitasiFormData>({
    resolver: zodResolver(ritasiFormSchema),
    defaultValues: {
      asal: '',
      tujuan: '',
      berangkat: '',
      sampai: '',
      kembali: '',
      tiba: '',
    },
  });

  const { setValue, handleSubmit } = form;

  const handleTimeClick = (field: keyof RitasiFormData) => {
    const currentTime = format(new Date(), 'HH:mm:ss');
    setValue(field, currentTime, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data: RitasiFormData) => {
    setIsSubmitting(true);
    if (!user || !vehicle) {
      toast({ variant: 'destructive', title: 'Error', description: 'Sesi tidak valid.' });
      setIsSubmitting(false);
      return;
    }
    
    try {
        await addRitasi({
            ...data,
            operatorId: user.id,
            operatorName: user.name,
            vehicleHullNumber: vehicle,
        });
        toast({ title: "Sukses", description: "Data ritasi berhasil disimpan." });
        form.reset();
    } catch (e) {
      console.error(e);
      // The context will show a toast on error
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = format(new Date(), 'eeee, dd MMMM yyyy', { locale: localeID });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Lembar Kerja Ritasi</CardTitle>
        <CardDescription>Catat waktu perjalanan Anda untuk setiap ritasi. Tekan "OK" untuk mengisi waktu secara otomatis.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="asal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih lokasi asal..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationNames.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tujuan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tujuan</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan lokasi tujuan..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="text-center font-semibold text-muted-foreground bg-muted/50 py-2 rounded-md">
              {today}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <TimeInput control={form.control} name="berangkat" label="Berangkat" onClick={handleTimeClick} />
              <TimeInput control={form.control} name="sampai" label="Sampai" onClick={handleTimeClick} />
              <TimeInput control={form.control} name="kembali" label="Kembali" onClick={handleTimeClick} />
              <TimeInput control={form.control} name="tiba" label="Tiba di BP" onClick={handleTimeClick} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Kirim & Simpan Ritasi
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}


function TimeInput({ control, name, label, onClick }: {
  control: any,
  name: keyof RitasiFormData,
  label: string,
  onClick: (field: keyof RitasiFormData) => void
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="flex items-center gap-2">
            <FormControl>
              <Input type="time" step="1" {...field} />
            </FormControl>
            <Button type="button" variant="outline" onClick={() => onClick(name)}>OK</Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
