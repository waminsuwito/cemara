
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChecklistItem, OtherDamageItem } from "@/components/checklist-item";
import { Header } from "@/components/ui/header";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


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

  const methods = useForm<ChecklistFormData>({
    resolver: zodResolver(checklistFormSchema),
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
      
      const result = await submitReport(reportData);
      
      const toastDescription = result === 'updated'
        ? "Laporan Anda untuk hari ini telah berhasil diperbarui."
        : "Checklist harian Anda telah berhasil dikirim.";

      toast({
        title: "Laporan Terkirim",
        description: toastDescription,
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

const feedbackFormSchema = z.object({
  message: z.string().min(10, { message: "Mohon isi pesan minimal 10 karakter." }),
});

type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

const ComplaintForm = () => {
    const { user: operator, vehicle: vehicleHullNumber } = useOperatorAuth();
    const { addComplaint } = useAppData();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<FeedbackFormData>({
        resolver: zodResolver(feedbackFormSchema),
        defaultValues: { message: "" },
    });

    const onSubmit = async (data: FeedbackFormData) => {
        setIsLoading(true);
        if (!operator || !vehicleHullNumber || !operator.location) {
            toast({ variant: "destructive", title: "Error", description: "Sesi tidak valid." });
            setIsLoading(false);
            return;
        }

        try {
            await addComplaint({
                operatorName: operator.name,
                vehicleId: vehicleHullNumber,
                location: operator.location,
                complaint: data.message,
            });
            form.reset();
        } catch (error) {
            // Error is already handled by the context
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
      <Card>
          <CardHeader>
              <CardTitle>Formulir Komplain</CardTitle>
              <CardDescription>Sampaikan komplain atau masalah teknis yang Anda hadapi. Tim mekanik akan segera menindaklanjuti.</CardDescription>
          </CardHeader>
          <CardContent>
              <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                              <FormItem>
                                  <Textarea {...field} rows={5} placeholder="Contoh: Rem terasa kurang pakem saat turunan, mohon diperiksa segera." />
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <Button type="submit" disabled={isLoading}>
                          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Kirim Komplain
                      </Button>
                  </form>
              </Form>
          </CardContent>
      </Card>
    );
};

const SuggestionForm = () => {
    const { user: operator, vehicle: vehicleHullNumber } = useOperatorAuth();
    const { addSuggestion } = useAppData();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<FeedbackFormData>({
        resolver: zodResolver(feedbackFormSchema),
        defaultValues: { message: "" },
    });

    const onSubmit = async (data: FeedbackFormData) => {
        setIsLoading(true);
        if (!operator || !vehicleHullNumber || !operator.location) {
            toast({ variant: "destructive", title: "Error", description: "Sesi tidak valid." });
            setIsLoading(false);
            return;
        }

        try {
            await addSuggestion({
                operatorName: operator.name,
                vehicleId: vehicleHullNumber,
                location: operator.location,
                suggestion: data.message,
            });
            form.reset();
        } catch (error) {
            // Error is already handled by the context
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Formulir Usulan / Saran</CardTitle>
                <CardDescription>Punya ide untuk membuat pekerjaan lebih baik, aman, atau efisien? Sampaikan usulan Anda di sini.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <Textarea {...field} rows={5} placeholder="Contoh: Mohon disediakan APAR (alat pemadam api ringan) yang baru di setiap kabin." />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kirim Usulan
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

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
        <Tabs defaultValue="checklist" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklist">Checklist Harian</TabsTrigger>
              <TabsTrigger value="complaint">Komplain ke Kantor</TabsTrigger>
              <TabsTrigger value="suggestion">Usulan Saya</TabsTrigger>
            </TabsList>
            <TabsContent value="checklist" className="mt-6">
                <div className="flex items-center mb-6">
                  <h1 className="text-2xl font-semibold md:text-3xl font-headline">
                    Checklist Harian Alat
                  </h1>
                </div>
                <ChecklistForm />
            </TabsContent>
            <TabsContent value="complaint" className="mt-6">
                <ComplaintForm />
            </TabsContent>
            <TabsContent value="suggestion" className="mt-6">
                <SuggestionForm />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
