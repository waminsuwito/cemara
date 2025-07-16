
"use client";

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAppData } from '@/context/app-data-context';
import { useOperatorAuth } from '@/context/operator-auth-context';
import { Loader2, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ritasiFormSchema = z.object({
  asal: z.string().min(1, 'Asal harus dipilih.'),
  tujuan: z.string().min(1, 'Tujuan harus diisi.'),
  berangkat: z.string().min(1, 'Jam berangkat harus diisi.'),
  sampai: z.string().min(1, 'Jam sampai harus diisi.'),
  kembali: z.string().min(1, 'Jam kembali harus diisi.'),
  tiba: z.string().min(1, 'Jam tiba di BP harus diisi.'),
});

type RitasiFormData = z.infer<typeof ritasiFormSchema>;

export default function RitasiPage() {
  const { locationNames, addRitasi } = useAppData();
  const { user, vehicle } = useOperatorAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = format(new Date(), 'eeee, dd MMMM yyyy', { locale: localeID });
  const todayKey = format(new Date(), 'yyyy-MM-dd');

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

  const { setValue, handleSubmit, watch, reset } = form;
  const formValues = watch();

  const getStorageKey = () => {
    if (!user || !vehicle) return null;
    return `ritasiForm-${user.id}-${vehicle}-${todayKey}`;
  };

  // Load state from localStorage on mount
  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          reset(parsedState);
        }
      } catch (e) {
        console.error("Failed to load ritasi state from local storage", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, vehicle, todayKey, reset]);

  // Save state to localStorage on change
  useEffect(() => {
    const storageKey = getStorageKey();
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(formValues));
      } catch (e) {
        console.error("Failed to save ritasi state to local storage", e);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues]);


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
        
        // Clear form and localStorage
        const storageKey = getStorageKey();
        if (storageKey) {
          localStorage.removeItem(storageKey);
        }
        form.reset({
            asal: '',
            tujuan: '',
            berangkat: '',
            sampai: '',
            kembali: '',
            tiba: '',
        });
    } catch (e) {
      console.error(e);
      // The context will show a toast on error
    } finally {
      setIsSubmitting(false);
    }
  };


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
                    <Select onValueChange={field.onChange} value={field.value || ""}>
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
                      <Input placeholder="Masukkan lokasi tujuan..." {...field} value={field.value || ''} />
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
              <Input type="time" step="1" {...field} value={field.value || ''} />
            </FormControl>
            <Button type="button" variant="outline" onClick={() => onClick(name)}>OK</Button>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
