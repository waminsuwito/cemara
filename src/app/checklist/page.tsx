
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChecklistItem, OtherDamageItem } from "@/components/checklist-item";
import { Header } from "@/components/header";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";
import { checklistItems, Report } from "@/lib/data";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.enum(["BAIK", "RUSAK", "PERLU PERHATIAN"]),
    keterangan: z.string(),
    foto: z.string().optional(),
  })),
  kerusakanLain: z.object({
    keterangan: z.string(),
    foto: z.string().optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;

function ChecklistForm() {
  const { user: operator, logout } = useOperatorAuth();
  const { submitReport, vehicles } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: checklistItems.map((item) => ({
        ...item,
        status: "BAIK",
        keterangan: "",
        foto: "",
      })),
      kerusakanLain: {
        keterangan: "",
        foto: "",
      },
    },
  });

  const onSubmit = (data: FormData) => {
    setIsLoading(true);
    
    if (!operator || !operator.batangan) {
        toast({ variant: "destructive", title: "Error", description: "Sesi operator tidak valid." });
        setIsLoading(false);
        return;
    }

    const vehicle = vehicles.find(v => v.hullNumber === operator.batangan);
    if (!vehicle) {
        toast({ variant: "destructive", title: "Error", description: "Kendaraan tidak ditemukan." });
        setIsLoading(false);
        return;
    }

    const damagedItems = data.items.filter(item => item.status === 'RUSAK');
    const needsAttentionItems = data.items.filter(item => item.status === 'PERLU PERHATIAN');
    const hasOtherDamage = data.kerusakanLain.keterangan.trim() !== '';
    
    let overallStatus: Report['overallStatus'] = 'Baik';
    if (damagedItems.length > 0 || hasOtherDamage) {
        overallStatus = 'Rusak';
    } else if (needsAttentionItems.length > 0) {
        overallStatus = 'Perlu Perhatian';
    }

    const reportData: Omit<Report, 'id' | 'timestamp'> = {
        vehicleId: vehicle.hullNumber,
        vehicleType: vehicle.type,
        operatorName: operator.name,
        location: operator.location!,
        overallStatus,
        items: data.items.filter(item => item.status !== 'BAIK').map(item => ({...item, keterangan: item.keterangan || ''})),
        kerusakanLain: data.kerusakanLain.keterangan ? { keterangan: data.kerusakanLain.keterangan, foto: data.kerusakanLain.foto } : undefined,
    };
    
    submitReport(reportData);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Laporan Terkirim",
        description: "Checklist harian Anda telah berhasil dikirim.",
      });
      logout();
      router.push("/");
    }, 1000);
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {checklistItems.map((item, index) => (
            <ChecklistItem key={item.id} index={index} label={item.label} />
          ))}
          <OtherDamageItem />
        </div>

        <div className="flex justify-end">
          <Button size="lg" type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Laporan
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}


export default function ChecklistPage() {
  const { user, isLoading } = useOperatorAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Memuat...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
          <h1 className="text-2xl font-semibold md:text-3xl font-headline">
            Checklist Harian Alat
          </h1>
        </div>
        <ChecklistForm />
      </main>
    </div>
  );
}
