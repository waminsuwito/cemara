
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppData } from "@/context/app-data-context";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useToast } from "@/hooks/use-toast";
import { Camera, RefreshCcw, Send, Loader2, VideoOff, CheckCircle, Clock, LogIn, LogOut, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type AttendanceType = 'masuk' | 'pulang';
type ViewState = 'selection' | 'capture';

interface TimeRule {
    enabled: boolean;
    message: string;
}

// NOTE: This logic assumes a single "workday" can span across midnight, e.g., until 2 AM.
const getAttendanceRules = (now: Date) => {
    const currentHour = now.getHours();
    
    // --- Absen Masuk Rules ---
    let masukRule: TimeRule;
    if (currentHour >= 3 && currentHour < 16) {
        masukRule = { enabled: true, message: "Anda dapat melakukan absen masuk." };
    } else if (currentHour < 3) {
        masukRule = { enabled: false, message: "Jam absen masuk belum tersedia (mulai pukul 03:00)." };
    } else { // currentHour >= 16
        masukRule = { enabled: false, message: "Waktu absen masuk telah berakhir (pukul 16:00)." };
    }

    // --- Absen Pulang Rules ---
    let pulangRule: TimeRule;
    const isEvening = currentHour >= 17;
    const isAfterMidnight = currentHour < 2; // up to 01:59
    
    const isPulangTime = isEvening || isAfterMidnight;
    
    // Specific check for 17:00 to 17:14
    const isBeforePulangStart = currentHour === 17 && now.getMinutes() < 15;

    if (isPulangTime && !isBeforePulangStart) {
        pulangRule = { enabled: true, message: "Anda dapat melakukan absen pulang." };
    } else {
        pulangRule = { enabled: false, message: "Jam pulang belum tersedia (mulai pukul 17:15)." };
    }

    return { masukRule, pulangRule };
};

export default function AbsensiKegiatanPage() {
    const { locationNames, addAttendance, getTodayAttendance } = useAppData();
    const { user } = useOperatorAuth();
    const { toast } = useToast();
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [view, setView] = useState<ViewState>('selection');
    const [attendanceType, setAttendanceType] = useState<AttendanceType | null>(null);
    const [selectedLocation, setSelectedLocation] = useState(user?.location || "");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [todayAttendance, setTodayAttendance] = useState({ masuk: false, pulang: false });
    const [rules, setRules] = useState(getAttendanceRules(new Date()));

    useEffect(() => {
        if (user) {
            const fetchAttendance = async () => {
                const att = await getTodayAttendance(user.id);
                setTodayAttendance({ masuk: !!att.masuk, pulang: !!att.pulang });
            };
            fetchAttendance();
        }
    }, [user, getTodayAttendance]);
    
     useEffect(() => {
        const timer = setInterval(() => {
            setRules(getAttendanceRules(new Date()));
        }, 60000); // Update rules every minute
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (view !== 'capture') return;

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
    }, [view, toast]);
    
    const handleStartCapture = (type: AttendanceType) => {
        setAttendanceType(type);
        setView('capture');
    };

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
    
    const handleBackToSelection = () => {
        setView('selection');
        setCapturedImage(null);
        setAttendanceType(null);
    };

    const handleSubmitAttendance = async () => {
        if (!capturedImage || !selectedLocation || !attendanceType || !user) {
            toast({ variant: 'destructive', title: 'Data Tidak Lengkap', description: 'Pastikan lokasi terpilih dan foto sudah diambil.' });
            return;
        }
        
        const now = new Date();
        if (attendanceType === 'masuk') {
            const currentHour = now.getHours();
            if (currentHour >= 16) {
                toast({ variant: 'destructive', title: 'ABSEN ANDA DITOLAK', description: 'Anda tidak dapat absen masuk setelah pukul 16:00. Anda dianggap tidak masuk kerja hari ini.' });
                return;
            }
        }
        if (attendanceType === 'pulang' && !todayAttendance.masuk) {
             toast({ variant: 'destructive', title: 'Absen Pulang Gagal', description: 'Anda harus melakukan absen masuk terlebih dahulu sebelum bisa absen pulang.' });
             return;
        }

        setIsSubmitting(true);
        
        let status = 'Tepat Waktu';
        if (attendanceType === 'masuk') {
            const isLate = now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() > 30);
            if(isLate) status = 'Terlambat';
        }

        try {
            await addAttendance({
                userId: user.id,
                userName: user.name,
                type: attendanceType,
                status,
                location: selectedLocation,
                photo: capturedImage
            });

            toast({ title: `Absen ${attendanceType === 'masuk' ? 'Masuk' : 'Pulang'} Berhasil`, description: `Absensi Anda di lokasi ${selectedLocation} telah direkam. ${status === 'Terlambat' ? 'Anda tercatat terlambat.' : ''}` });
            setTodayAttendance(prev => ({ ...prev, [attendanceType]: true }));
            handleBackToSelection();
        } catch (error) {
            // Error is handled in context
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const renderSelection = () => (
        <div className="flex flex-col items-center gap-6 animate-in fade-in-50 w-full max-w-lg mx-auto">
            <h3 className="text-xl font-semibold text-center">Silakan Pilih Jenis Absensi</h3>
            
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Informasi Jadwal</AlertTitle>
                <AlertDescription>
                    <p><strong>Absen Masuk:</strong> 03:00 - 16:00 (Batas Tepat Waktu: 07:30)</p>
                    <p><strong>Absen Pulang:</strong> 17:15 - 02:00</p>
                </AlertDescription>
            </Alert>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                    size="lg" 
                    className="h-24 flex-col gap-2"
                    disabled={!rules.masukRule.enabled || todayAttendance.masuk}
                    onClick={() => handleStartCapture('masuk')}
                >
                    <LogIn className="w-8 h-8"/>
                    <span>Absen Masuk</span>
                    <span className="text-xs font-normal opacity-80">{rules.masukRule.message}</span>
                     {todayAttendance.masuk && <span className="text-xs font-bold text-green-400">(Sudah Absen)</span>}
                </Button>
                 <Button 
                    size="lg" 
                    className="h-24 flex-col gap-2"
                    disabled={!rules.pulangRule.enabled || todayAttendance.pulang || !todayAttendance.masuk}
                    onClick={() => handleStartCapture('pulang')}
                >
                    <LogOut className="w-8 h-8"/>
                    <span>Absen Pulang</span>
                    <span className="text-xs font-normal opacity-80">{rules.pulangRule.message}</span>
                    {!todayAttendance.masuk && <span className="text-xs font-bold text-destructive">(Absen Masuk Dulu)</span>}
                    {todayAttendance.pulang && <span className="text-xs font-bold text-green-400">(Sudah Absen)</span>}
                </Button>
            </div>
        </div>
    );
    
    const renderCapture = () => (
        <div className="flex flex-col items-center gap-4 animate-in fade-in-50 w-full max-w-lg mx-auto">
            <h3 className="text-xl font-semibold">Absen {attendanceType === 'masuk' ? 'Masuk' : 'Pulang'}</h3>
            <Select value={selectedLocation} onValueChange={setSelectedLocation} disabled={!!user?.location}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Lokasi Absen" />
                </SelectTrigger>
                <SelectContent>
                    {locationNames.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                </SelectContent>
            </Select>
            
            <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
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

            <Button variant="link" onClick={handleBackToSelection} className="mt-4">Kembali ke Pilihan</Button>
        </div>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Absensi & Kegiatan</CardTitle>
                <CardDescription>
                    Lakukan absensi masuk dan pulang kerja menggunakan kamera.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {view === 'selection' && renderSelection()}
                {view === 'capture' && renderCapture()}
            </CardContent>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </Card>
    );
}
