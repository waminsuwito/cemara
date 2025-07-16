
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/context/app-data-context";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useToast } from "@/hooks/use-toast";
import { Camera, RefreshCcw, Send, Loader2, VideoOff, CheckCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

type WorkPeriod = 'Pagi' | 'Siang' | 'Malam' | null;

const getCurrentWorkPeriod = (): WorkPeriod => {
    const now = new Date();
    const currentHour = now.getHours();

    if (currentHour >= 7 && currentHour < 12) return 'Pagi';
    if (currentHour >= 12 && currentHour < 17) return 'Siang';
    if (currentHour >= 17 && currentHour <= 23) return 'Malam';
    
    return null;
};

export default function AbsensiKegiatanPage() {
    const { locationNames } = useAppData();
    const { user } = useOperatorAuth();
    const { toast } = useToast();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [uiStep, setUiStep] = useState<'capture' | 'plan' | 'done'>('capture');
    const [selectedLocation, setSelectedLocation] = useState(user?.location || "");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    
    const [workPlanPagi, setWorkPlanPagi] = useState("");
    const [workPlanSiang, setWorkPlanSiang] = useState("");
    const [workPlanMalam, setWorkPlanMalam] = useState("");
    
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activePeriod, setActivePeriod] = useState<WorkPeriod>(null);
    
    useEffect(() => {
        if (uiStep === 'plan') {
          setActivePeriod(getCurrentWorkPeriod());
        }
    }, [uiStep]);

    useEffect(() => {
        if (uiStep !== 'capture') return;

        const getCameraPermission = async () => {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setHasCameraPermission(true);
          } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
              variant: 'destructive',
              title: 'Akses Kamera Ditolak',
              description: 'Mohon izinkan akses kamera di pengaturan browser Anda untuk menggunakan fitur ini.',
            });
          }
        };

        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [uiStep, toast]);
    
    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            setCapturedImage(canvas.toDataURL('image/jpeg'));
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleSubmitAttendance = async () => {
        if (!capturedImage || !selectedLocation) {
            toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Mohon pilih lokasi dan ambil foto terlebih dahulu.' });
            return;
        }
        setIsSubmitting(true);
        
        console.log("Submitting attendance:", {
            userId: user?.id,
            location: selectedLocation,
            timestamp: new Date(),
            photo: capturedImage.substring(0, 30) + '...'
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({ title: 'Absensi Berhasil', description: `Absensi untuk lokasi ${selectedLocation} telah direkam.` });
        setIsSubmitting(false);
        setUiStep('plan');
    };
    
    const handleSubmitWorkPlan = async () => {
        if (!activePeriod) return;

        const plans = {
            Pagi: workPlanPagi,
            Siang: workPlanSiang,
            Malam: workPlanMalam,
        };
        const currentPlan = plans[activePeriod];
        
        if (!currentPlan) {
            toast({ variant: 'destructive', title: `Rencana Kerja ${activePeriod} Kosong`, description: 'Mohon isi rencana kerja Anda.' });
            return;
        }
        setIsSubmitting(true);
        
        console.log("Submitting work plan:", {
            userId: user?.id,
            timestamp: new Date(),
            period: activePeriod,
            workPlan: currentPlan,
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({ title: 'Rencana Kerja Terkirim', description: 'Terima kasih dan selamat bekerja!' });
        setIsSubmitting(false);
        setUiStep('done');
    };
    
    const handleReset = () => {
        setCapturedImage(null);
        setWorkPlanPagi("");
        setWorkPlanSiang("");
        setWorkPlanMalam("");
        setUiStep('capture');
    };

    const isSubmitPlanDisabled = () => {
        if (isSubmitting || !activePeriod) return true;
        if (activePeriod === 'Pagi' && !workPlanPagi) return true;
        if (activePeriod === 'Siang' && !workPlanSiang) return true;
        if (activePeriod === 'Malam' && !workPlanMalam) return true;
        return false;
    };

    const renderCaptureStep = () => (
        <>
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!!user?.location}>
                <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder="Pilih Lokasi Absen" />
                </SelectTrigger>
                <SelectContent>
                    {locationNames.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                </SelectContent>
            </Select>
            
            <div className="relative aspect-video w-full max-w-lg mx-auto bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured attendance" className="w-full h-full object-cover" />
                ) : (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                )}
                
                {hasCameraPermission === false && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <VideoOff className="w-16 h-16 text-destructive" />
                        <p className="mt-4 font-semibold">Kamera Tidak Tersedia</p>
                        <p className="text-sm text-muted-foreground">Izinkan akses kamera untuk melanjutkan.</p>
                    </div>
                )}
            </div>
            
            {hasCameraPermission === null && (
                 <div className="flex items-center justify-center text-muted-foreground p-4">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    <span>Memuat kamera...</span>
                </div>
            )}
            
            {hasCameraPermission === true && (
                 <div className="flex justify-center gap-4">
                    {capturedImage ? (
                        <>
                            <Button variant="outline" onClick={handleRetake} disabled={isSubmitting}>
                                <RefreshCcw className="mr-2 h-4 w-4" /> Ambil Ulang
                            </Button>
                            <Button onClick={handleSubmitAttendance} disabled={isSubmitting || !selectedLocation}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Kirim Absen
                            </Button>
                        </>
                    ) : (
                        <Button onClick={handleCapture} size="lg" disabled={!selectedLocation}>
                            <Camera className="mr-2 h-5 w-5" /> Ambil Foto
                        </Button>
                    )}
                </div>
            )}
        </>
    );

    const renderPlanStep = () => (
        <div className="flex flex-col items-center gap-6 animate-in fade-in-50 w-full max-w-lg mx-auto">
            <h3 className="text-xl font-semibold">Apa rencana kerja Anda?</h3>
            
            {!activePeriod && (
                <div className="text-center p-6 border-dashed border-2 rounded-lg bg-muted/50">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="mt-4 font-semibold">Di Luar Jam Kerja</p>
                    <p className="text-sm text-muted-foreground">Pengisian rencana kerja hanya dapat dilakukan pada jam kerja yang telah ditentukan.</p>
                </div>
            )}

            <div className="w-full space-y-4">
                <div>
                    <label className="font-medium">Rencana Kerja Pagi (07:00 - 11:00)</label>
                    <Textarea
                        placeholder="Contoh: Mengoperasikan alat sesuai jadwal..."
                        rows={3}
                        value={workPlanPagi}
                        onChange={(e) => setWorkPlanPagi(e.target.value)}
                        disabled={activePeriod !== 'Pagi'}
                        className={activePeriod === 'Pagi' ? 'border-primary' : ''}
                    />
                </div>
                 <div>
                    <label className="font-medium">Rencana Kerja Siang (12:00 - 16:00)</label>
                    <Textarea
                        placeholder="Contoh: Memastikan checklist harian terisi..."
                        rows={3}
                        value={workPlanSiang}
                        onChange={(e) => setWorkPlanSiang(e.target.value)}
                        disabled={activePeriod !== 'Siang'}
                        className={activePeriod === 'Siang' ? 'border-primary' : ''}
                    />
                </div>
                 <div>
                    <label className="font-medium">Rencana Kerja Malam (17:00 - 23:59)</label>
                    <Textarea
                        placeholder="Contoh: Memarkirkan alat di tempat yang aman..."
                        rows={3}
                        value={workPlanMalam}
                        onChange={(e) => setWorkPlanMalam(e.target.value)}
                        disabled={activePeriod !== 'Malam'}
                        className={activePeriod === 'Malam' ? 'border-primary' : ''}
                    />
                </div>
            </div>

            <Button onClick={handleSubmitWorkPlan} disabled={isSubmitPlanDisabled()}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Kirim Rencana Kerja
            </Button>
        </div>
    );
    
    const renderDoneStep = () => (
        <div className="flex flex-col items-center text-center gap-4 p-8 animate-in fade-in-50">
            <CheckCircle className="w-20 h-20 text-green-500" />
            <h3 className="text-2xl font-bold">Terima Kasih!</h3>
            <p className="text-muted-foreground">Absensi dan rencana kerja Anda telah berhasil direkam. Selamat bekerja!</p>
            <Button onClick={handleReset} className="mt-4">
                Lakukan Absensi Lagi
            </Button>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Absensi & Kegiatan</CardTitle>
                <CardDescription>
                    Ambil foto untuk merekam absensi dan catat rencana kerja harian Anda.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {uiStep === 'capture' && renderCaptureStep()}
                {uiStep === 'plan' && renderPlanStep()}
                {uiStep === 'done' && renderDoneStep()}
            </CardContent>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </Card>
    );
}
