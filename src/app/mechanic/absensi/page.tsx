
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useToast } from "@/hooks/use-toast";
import { Camera, RefreshCcw, Send, Loader2, VideoOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AbsensiKegiatanPage() {
    const { locationNames } = useAppData();
    const { user } = useAdminAuth();
    const { toast } = useToast();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [selectedLocation, setSelectedLocation] = useState(user?.location || "");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
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
    }, [toast]);
    
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

    const handleSubmit = async () => {
        if (!capturedImage || !selectedLocation) {
            toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Mohon pilih lokasi dan ambil foto terlebih dahulu.' });
            return;
        }
        setIsSubmitting(true);
        
        // TODO: Implement submission logic (e.g., upload to Firebase Storage, save record to Firestore)
        console.log({
            userId: user?.username,
            location: selectedLocation,
            timestamp: new Date(),
            photo: capturedImage.substring(0, 30) + '...' // Log snippet
        });
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast({ title: 'Absensi Berhasil', description: `Absensi untuk lokasi ${selectedLocation} telah direkam.` });
        setIsSubmitting(false);
        setCapturedImage(null);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Absensi & Kegiatan</CardTitle>
                <CardDescription>
                    Ambil foto untuk merekam absensi Anda di lokasi yang dipilih.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!user?.role || user.role !== 'SUPER_ADMIN'}>
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
                                <Button onClick={handleSubmit} disabled={isSubmitting || !selectedLocation}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Kirim Absen
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleCapture} size="lg">
                                <Camera className="mr-2 h-5 w-5" /> Ambil Foto
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </Card>
    );
}

