
"use client";

import React, { useEffect, useState, useMemo } from "react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, subDays, eachDayOfInterval, isSameDay, startOfDay } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

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

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Baik":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Baik</Badge>;
    case "Perlu Perhatian":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Perlu Perhatian</Badge>;
    case "Rusak":
      return <Badge variant="destructive">Rusak</Badge>;
    case "Tidak Ada Checklist":
       return <Badge variant="outline">Tidak Ada Checklist</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

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

const MyHistoryTab = () => {
    const { user: operator, vehicle: vehicleHullNumber } = useOperatorAuth();
    const { reports } = useAppData();
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    const myHistory = useMemo(() => {
        if (!operator) return [];

        const operatorReports = reports.filter(r => r.operatorName === operator.name);

        const end = startOfDay(new Date());
        const start = subDays(end, 29); // Last 30 days including today
        const dateInterval = eachDayOfInterval({ start, end }).reverse();

        return dateInterval.map(date => {
            const reportForDay = operatorReports.find(r => isSameDay(new Date(r.timestamp), date));
            
            if (reportForDay) {
                return reportForDay;
            } else {
                return {
                    id: date.toISOString(),
                    timestamp: date.getTime(),
                    vehicleId: vehicleHullNumber || 'N/A',
                    overallStatus: 'Tidak Ada Checklist',
                    isPlaceholder: true,
                };
            }
        });
    }, [reports, operator, vehicleHullNumber]);

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Riwayat Checklist Saya</CardTitle>
                    <CardDescription>Menampilkan riwayat checklist Anda selama 30 hari terakhir.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Kendaraan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {myHistory.length > 0 ? (
                                    myHistory.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(new Date(item.timestamp), (item as any).isPlaceholder ? 'dd MMM yyyy' : 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                                            <TableCell>{item.vehicleId}</TableCell>
                                            <TableCell>{getStatusBadge(item.overallStatus)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setSelectedReport(item as Report)}
                                                    disabled={(item as any).isPlaceholder}
                                                >
                                                    Detail
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            Memuat riwayat...
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="sm:max-w-lg">
                  {selectedReport && (
                    <>
                    <DialogHeader>
                        <DialogTitle>Detail Laporan: {selectedReport.vehicleId}</DialogTitle>
                        <DialogDescription>
                            Laporan oleh Anda pada {format(new Date(selectedReport.timestamp), 'dd MMMM yyyy, HH:mm', { locale: localeID })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto p-1 pr-4 space-y-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Item Checklist</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {selectedReport.items && selectedReport.items.length > 0 ? selectedReport.items.map((item: ReportItem, index: number) => (
                                    <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{item.label}</p>
                                            {getStatusBadge(item.status === 'BAIK' ? 'Baik' : item.status === 'RUSAK' ? 'Rusak' : 'Perlu Perhatian')}
                                        </div>
                                        {item.status !== 'BAIK' && (
                                          <>
                                            <p className="text-sm mt-1">{item.keterangan || "Tidak ada keterangan."}</p>
                                            {item.foto && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                                    <a href={item.foto} target="_blank" rel="noopener noreferrer">
                                                        <img src={item.foto} alt={`Foto ${item.label}`} className="rounded-md w-full max-w-xs cursor-pointer" data-ai-hint="machine damage" />
                                                    </a>
                                                </div>
                                            )}
                                          </>
                                        )}
                                    </div>
                                )) : <p className="text-muted-foreground">Semua item checklist dalam kondisi baik.</p>}
                            </CardContent>
                        </Card>

                        {selectedReport.kerusakanLain && selectedReport.kerusakanLain.keterangan && (
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Kerusakan Lainnya</CardTitle></CardHeader>
                                <CardContent>
                                    <p>{selectedReport.kerusakanLain.keterangan}</p>
                                    {selectedReport.kerusakanLain.foto && (
                                        <div className="mt-2">
                                            <p className="text-sm text-muted-foreground mb-1">Foto:</p>
                                            <a href={selectedReport.kerusakanLain.foto} target="_blank" rel="noopener noreferrer">
                                                <img src={selectedReport.kerusakanLain.foto} alt="Foto Kerusakan Lainnya" className="rounded-md w-full max-w-xs cursor-pointer" data-ai-hint="machine part" />
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                    </>
                  )}
                </DialogContent>
            </Dialog>
        </>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="checklist">Checklist Harian</TabsTrigger>
              <TabsTrigger value="complaint">Komplain ke Kantor</TabsTrigger>
              <TabsTrigger value="suggestion">Usulan Saya</TabsTrigger>
              <TabsTrigger value="history">Riwayat Saya</TabsTrigger>
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
            <TabsContent value="history" className="mt-6">
                <MyHistoryTab />
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
