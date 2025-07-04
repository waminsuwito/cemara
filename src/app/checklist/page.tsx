
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChecklistItem, OtherDamageItem } from "@/components/checklist-item";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";
import { checklistItems, batchingPlantChecklistItems, batchingPlantBatangan, Report, ReportItem } from "@/lib/data";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";


const checklistFormSchema = z.object({
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

type ChecklistFormData = z.infer<typeof checklistFormSchema>;


function ChecklistForm() {
  const { user: operator, vehicle: vehicleHullNumber, logout } = useOperatorAuth();
  const { submitReport, vehicles } = useAppData();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const selectedVehicle = useMemo(() => {
    if (!vehicleHullNumber) return null;
    return vehicles.find(v => v.hullNumber === vehicleHullNumber);
  }, [vehicleHullNumber, vehicles]);

  const itemsToRender = useMemo(() => {
    if (selectedVehicle && batchingPlantBatangan.includes(selectedVehicle.licensePlate)) {
      return batchingPlantChecklistItems;
    }
    return checklistItems;
  }, [selectedVehicle]);

  const methods = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistFormSchema),
    defaultValues: {
      items: [],
      kerusakanLain: {
        keterangan: "",
        foto: undefined,
      },
    },
  });

  const { reset } = methods;

  useEffect(() => {
    if (itemsToRender.length > 0) {
      reset({
        items: itemsToRender.map((item) => ({
          ...item,
          status: "BAIK",
          keterangan: "",
          foto: undefined,
        })),
        kerusakanLain: {
          keterangan: "",
          foto: undefined,
        },
      });
    }
  }, [reset, itemsToRender]);

  const onSubmit = async (data: ChecklistFormData) => {
    setIsLoading(true);
    
    if (!operator || !vehicleHullNumber) {
        toast({ variant: "destructive", title: "Error", description: "Sesi operator atau kendaraan tidak valid." });
        setIsLoading(false);
        return;
    }

    const vehicle = vehicles.find(v => v.hullNumber === vehicleHullNumber);

    if (!vehicle) {
        toast({ variant: "destructive", title: "Error", description: `Kendaraan dengan nomor lambung "${vehicleHullNumber}" tidak ditemukan.` });
        setIsLoading(false);
        return;
    }
    
    if (!operator.location) {
        toast({ variant: "destructive", title: "Submit Gagal", description: "Profil Anda tidak memiliki lokasi. Mohon hubungi admin." });
        setIsLoading(false);
        return;
    }

    try {
      const uploadImageAndGetURL = async (file: File): Promise<string | undefined> => {
        if (!file || !(file instanceof File)) return undefined;
        try {
          const storageRef = ref(storage, `report-images/${uuidv4()}-${file.name}`);
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          return downloadURL;
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          // Don't block submission, just log the error and proceed without the image
          return undefined;
        }
      };

      const reportItems: ReportItem[] = [];
      for (const item of data.items) {
        if (item.status !== 'BAIK') {
          const cleanItem: ReportItem = {
            id: item.id,
            label: item.label,
            status: item.status,
            keterangan: item.keterangan || '',
          };
          if (item.foto) {
            cleanItem.foto = await uploadImageAndGetURL(item.foto);
          }
          reportItems.push(cleanItem);
        }
      }

      const kerusakanLainFotoUrl = await uploadImageAndGetURL(data.kerusakanLain.foto);
      
      const damagedItems = reportItems.filter(item => item.status === 'RUSAK');
      const needsAttentionItems = reportItems.filter(item => item.status === 'PERLU PERHATIAN');
      const hasOtherDamage = data.kerusakanLain.keterangan.trim() !== '';
      
      let overallStatus: Report['overallStatus'] = 'Baik';
      if (damagedItems.length > 0 || hasOtherDamage) {
          overallStatus = 'Rusak';
      } else if (needsAttentionItems.length > 0) {
          overallStatus = 'Perlu Perhatian';
      }

      const reportData: Omit<Report, 'id' | 'timestamp' | 'reportDate'> = {
          vehicleId: vehicle.hullNumber,
          vehicleType: vehicle.type,
          operatorName: operator.name,
          location: operator.location,
          overallStatus,
          items: reportItems,
      };
      
      if (hasOtherDamage || kerusakanLainFotoUrl) {
          reportData.kerusakanLain = {
              keterangan: data.kerusakanLain.keterangan,
          };
          if (kerusakanLainFotoUrl) {
              reportData.kerusakanLain.foto = kerusakanLainFotoUrl;
          }
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
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.";
      toast({
        variant: "destructive",
        title: "Submit Gagal",
        description: `Pesan Error: ${errorMessage}. Mohon laporkan pesan ini ke admin.`,
        duration: 9000,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itemsToRender.map((item, index) => (
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
  const { user, vehicle, isLoading } = useOperatorAuth();
  const router = useRouter();

  useEffect(() => {
    // This logic is partially handled by the layout, but kept for robustness
    if (!isLoading && !user) {
      router.replace("/");
    }
    // If user is logged in but hasn't selected a vehicle, redirect them to the selection page.
    if (!isLoading && user && !vehicle) {
      router.replace("/checklist/select-vehicle");
    }
  }, [user, vehicle, isLoading, router]);

  if (isLoading || !user || !vehicle) {
    // The layout already shows a loading state, this is a fallback.
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-semibold md:text-3xl font-headline">
          Checklist Harian Alat
        </h1>
      </div>
      <ChecklistForm />
    </>
  );
}
