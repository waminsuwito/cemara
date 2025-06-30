
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
import { checklistItems, Report, ReportItem } from "@/lib/data";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

const formSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    label: z.string(),
    status: z.enum(["BAIK", "RUSAK", "PERLU PERHATIAN"]),
    keterangan: z.string(),
    foto: z.any().optional(),
  })),
  kerusakanLain: z.object({
    keterangan: z.string(),
    foto: z.any().optional(),
  }),
});

type FormData = z.infer<typeof formSchema>;

function ChecklistForm() {
  const { user: operator, vehicle: vehicleHullNumber, logout } = useOperatorAuth();
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
        foto: undefined,
      })),
      kerusakanLain: {
        keterangan: "",
        foto: undefined,
      },
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    
    if (!operator || !vehicleHullNumber) {
        toast({ variant: "destructive", title: "Error", description: "Sesi operator atau kendaraan tidak valid." });
        setIsLoading(false);
        return;
    }

    if (!operator.location) {
        toast({ variant: "destructive", title: "Submit Gagal", description: "Profil Anda tidak memiliki lokasi. Mohon hubungi admin." });
        setIsLoading(false);
        return;
    }

    const vehicle = vehicles.find(v => v.hullNumber === vehicleHullNumber);
    if (!vehicle) {
        toast({ variant: "destructive", title: "Error", description: `Kendaraan dengan nomor lambung "${vehicleHullNumber}" tidak ditemukan.` });
        setIsLoading(false);
        return;
    }

    try {
      const uploadImageAndGetURL = async (file: File) => {
        if (!file || !(file instanceof File)) return undefined;
        const storageRef = ref(storage, `report-images/${uuidv4()}-${file.name}`);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
      };

      const itemsWithUrls = await Promise.all(
        data.items.map(async (item) => ({
            id: item.id,
            label: item.label,
            status: item.status,
            keterangan: item.keterangan,
            foto: await uploadImageAndGetURL(item.foto),
        }))
      );

      const kerusakanLainFotoUrl = await uploadImageAndGetURL(data.kerusakanLain.foto);
      const kerusakanLainWithUrl = {
        keterangan: data.kerusakanLain.keterangan,
        foto: kerusakanLainFotoUrl,
      };
      
      const damagedItems = itemsWithUrls.filter(item => item.status === 'RUSAK');
      const needsAttentionItems = itemsWithUrls.filter(item => item.status === 'PERLU PERHATIAN');
      const hasOtherDamage = kerusakanLainWithUrl.keterangan.trim() !== '';
      
      let overallStatus: Report['overallStatus'] = 'Baik';
      if (damagedItems.length > 0 || hasOtherDamage) {
          overallStatus = 'Rusak';
      } else if (needsAttentionItems.length > 0) {
          overallStatus = 'Perlu Perhatian';
      }

      // Create clean report items, only including foto if it exists
      const reportItems: ReportItem[] = itemsWithUrls
        .filter(item => item.status !== 'BAIK')
        .map(item => {
            const cleanItem: ReportItem = {
                id: item.id,
                label: item.label,
                status: item.status,
                keterangan: item.keterangan || '',
            };
            if (item.foto) {
                cleanItem.foto = item.foto;
            }
            return cleanItem;
        });

      // Construct the final report data, ensuring no undefined fields are sent
      const reportData: Omit<Report, 'id' | 'timestamp'> = {
          vehicleId: vehicle.hullNumber,
          vehicleType: vehicle.type,
          operatorName: operator.name,
          location: operator.location,
          overallStatus,
          items: reportItems,
      };
      
      if (kerusakanLainWithUrl.keterangan) {
          const kerusakanLainData: { keterangan: string, foto?: string } = {
              keterangan: kerusakanLainWithUrl.keterangan,
          };
          if (kerusakanLainWithUrl.foto) {
              kerusakanLainData.foto = kerusakanLainWithUrl.foto;
          }
          reportData.kerusakanLain = kerusakanLainData;
      }
      
      await submitReport(reportData);
      
      toast({
        title: "Laporan Terkirim",
        description: "Checklist harian Anda telah berhasil dikirim.",
      });
      logout();
      router.push("/");

    } catch (error) {
      console.error("Error during submission:", error);
      toast({ variant: "destructive", title: "Submit Gagal", description: "Terjadi kesalahan saat mengirim laporan. Mohon coba lagi."});
    } finally {
      setIsLoading(false);
    }
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
