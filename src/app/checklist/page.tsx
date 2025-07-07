
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
import { startOfDay } from "date-fns";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


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


function ChecklistForm({ reportToUpdate }: { reportToUpdate: Report | null }) {
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
    if (itemsToRender.length === 0) return;

    if (reportToUpdate) {
        // Pre-fill from an existing, unresolved report
        const formItems = itemsToRender.map((templateItem) => {
            const reportedItem = reportToUpdate.items.find(i => i.id === templateItem.id);
            if (reportedItem) {
                // This is where the error happens.
                // The status from Firestore is treated as a generic string.
                // We need to ensure it's one of the allowed values for the form.
                const validStatus = (s: any): "BAIK" | "RUSAK" | "PERLU PERHATIAN" => {
                    const upperS = s?.toUpperCase();
                    if (upperS === "BAIK" || upperS === "RUSAK" || upperS === "PERLU PERHATIAN") {
                        return upperS;
                    }
                    // Default to a safe value if the data is somehow corrupt or unexpected.
                    return "PERLU PERHATIAN"; 
                };

                return { 
                    id: reportedItem.id,
                    label: reportedItem.label,
                    status: validStatus(reportedItem.status),
                    keterangan: reportedItem.keterangan || '',
                    foto: undefined // We can't pre-fill file inputs
                };
            }
            // This item was 'BAIK' in the previous report (implicitly)
            return {
                id: templateItem.id,
                label: templateItem.label,
                status: 'BAIK',
                keterangan: '',
                foto: undefined,
            };
        });

        reset({
            items: formItems,
            kerusakanLain: {
                keterangan: reportToUpdate.kerusakanLain?.keterangan || "",
                foto: undefined,
            },
        });

    } else {
        // Default behavior for a fresh checklist
        reset({
            items: itemsToRender.map((item) => ({
                ...item,
                status: 'BAIK',
                keterangan: '',
                foto: undefined,
            })),
            kerusakanLain: {
                keterangan: '',
                foto: undefined,
            },
        });
    }
  }, [reset, itemsToRender, reportToUpdate]);

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
      
      await submitReport(reportData, reportToUpdate?.id);
      
      toast({
        title: reportToUpdate ? "Laporan Diperbarui" : "Laporan Terkirim",
        description: reportToUpdate ? "Detail kerusakan telah berhasil diperbarui." : "Checklist harian Anda telah berhasil dikirim.",
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
            {reportToUpdate ? 'Perbarui Laporan' : 'Kirim Laporan'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}


function ChecklistPageContents() {
  const { user, vehicle, isLoading: authIsLoading, logout } = useOperatorAuth();
  const { reports, vehicles, isDataLoaded, submitReport } = useAppData();
  const router = useRouter();
  const { toast } = useToast();

  const [unresolvedReport, setUnresolvedReport] = useState<Report | null>(null);
  const [dialogStep, setDialogStep] = useState<'hidden' | 'initial' | 'confirm_resolve'>('hidden');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (authIsLoading || !isDataLoaded) return;
    if (!user) {
      router.replace("/");
      return;
    }
    if (!vehicle) {
      router.replace("/checklist/select-vehicle");
      return;
    }

    const reportsForVehicle = reports
        .filter(r => r.vehicleId === vehicle)
        .sort((a, b) => b.timestamp - a.timestamp);
    
    const latestReport = reportsForVehicle[0];

    if (latestReport && (latestReport.overallStatus === 'Rusak' || latestReport.overallStatus === 'Perlu Perhatian')) {
        setUnresolvedReport(latestReport);
        setDialogStep('initial');
    } else {
        setUnresolvedReport(null);
        setDialogStep('hidden');
    }
  }, [user, vehicle, reports, authIsLoading, isDataLoaded, router]);


  const handleDialogTambah = () => {
    setDialogStep('hidden'); 
  };

  const handleDialogSelesai = () => {
    setDialogStep('confirm_resolve');
  };
    
  const handleConfirmResolve = async (resolvedBy: 'Dikerjakan Sendiri' | 'Dikerjakan Mekanik') => {
    setIsProcessing(true);
    if (!user || !vehicle) return;
    
    const vehicleDetails = vehicles.find(v => v.hullNumber === vehicle);
    if (!vehicleDetails || !user.location) return;

    const reportData = {
        vehicleId: vehicle,
        vehicleType: vehicleDetails.type,
        operatorName: user.name,
        location: user.location,
        overallStatus: 'Baik' as const,
        items: [],
        kerusakanLain: {
            keterangan: `Perbaikan dari laporan sebelumnya telah selesai. Dikerjakan oleh: ${resolvedBy}.`,
        }
    };
    
    try {
      await submitReport(reportData);
      toast({ title: "Status Diperbarui", description: "Kendaraan telah ditandai dalam kondisi Baik. Anda akan logout." });
      logout();
      router.push('/');
    } catch(e) {
      toast({ variant: "destructive", title: "Gagal Menyimpan", description: "Tidak dapat menandai perbaikan selesai."});
      setIsProcessing(false);
    }
  };

  if (authIsLoading || !isDataLoaded || (dialogStep !== 'hidden' && !unresolvedReport)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dialogStep === 'initial') {
      return (
          <AlertDialog open onOpenChange={() => {}}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Laporan Kerusakan Ditemukan</AlertDialogTitle>
                      <AlertDialogDescription>
                          Sistem menemukan laporan kerusakan/perlu perhatian yang belum terselesaikan untuk kendaraan ini. Apa yang ingin Anda lakukan?
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <Button variant="outline" onClick={handleDialogTambah}>Tambah/Perbarui Laporan Kerusakan</Button>
                      <Button onClick={handleDialogSelesai}>Kendaraan Sudah Diperbaiki</Button>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      );
  }
  
  if (dialogStep === 'confirm_resolve') {
      return (
            <AlertDialog open onOpenChange={() => {}}>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Perbaikan</AlertDialogTitle>
                      <AlertDialogDescription>
                          Siapa yang melakukan perbaikan pada kendaraan ini?
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <Button variant="outline" onClick={() => handleConfirmResolve('Dikerjakan Sendiri')} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Dikerjakan Sendiri
                      </Button>
                      <Button onClick={() => handleConfirmResolve('Dikerjakan Mekanik')} disabled={isProcessing}>
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Dikerjakan Mekanik
                      </Button>
                  </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
      );
  }

  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-semibold md:text-3xl font-headline">
          {unresolvedReport ? 'Perbarui Laporan Checklist' : 'Checklist Harian Alat'}
        </h1>
      </div>
      <ChecklistForm reportToUpdate={unresolvedReport} />
    </>
  );
}


export default function ChecklistPage() {
  const { user, vehicle, isLoading } = useOperatorAuth();
  
  if (isLoading || !user || !vehicle) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ChecklistPageContents />;
}
