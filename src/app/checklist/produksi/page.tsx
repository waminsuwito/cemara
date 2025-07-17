
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Play, Square, Gauge, Wheat, Gem, Droplets, Component, Settings, ClipboardList, Speaker, ArrowDown, ArrowUp, Zap, CircleUser, LogOut } from 'lucide-react';
import { useOperatorAuth } from '@/context/operator-auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { JmfDialog } from '@/components/jmf-dialog';
import { Label } from '@/components/ui/label';

const WeightIndicator = ({ label, value, unit, icon: Icon }: { label: string, value: string, unit: string, icon: React.ElementType }) => (
    <Card className="text-center bg-gray-900/60 border-white/10 backdrop-blur-sm shadow-lg flex flex-col justify-between">
        <CardHeader className="p-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-center gap-2">
                <Icon className="w-4 h-4 text-primary" />
                {label}
            </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
            <p className="text-3xl font-mono font-bold text-foreground tracking-tight">
                {value}
            </p>
            <p className="text-xs text-muted-foreground -mt-1">{unit}</p>
        </CardContent>
    </Card>
);

const MaterialButton = ({ label, className, icon: Icon }: { label: string, className?: string, icon?: React.ElementType }) => (
    <Button variant="secondary" className={cn("h-16 text-base flex-col gap-1 shadow-md bg-gray-700/50 hover:bg-gray-700/80 border border-white/10", className)}>
         {Icon && <Icon className="w-5 h-5 mb-1 text-primary/80" />}
         <span className="text-xs sm:text-sm">{label}</span>
    </Button>
);

const ProductionInput = ({ label, unit }: { label: string, unit?: string }) => (
    <div className="flex items-center">
        <Label className="w-1/2 text-sm text-muted-foreground">{label}</Label>
        <div className="w-1/2 flex items-center">
            <Input className="h-8 bg-gray-700/50 border-white/10 text-right font-mono" />
            {unit && <span className="ml-2 text-sm text-muted-foreground">{unit}</span>}
        </div>
    </div>
);


const indicators = [
    { label: "PASIR", value: "0.00", unit: "KG", icon: Gauge },
    { label: "BATU", value: "0.00", unit: "KG", icon: Gem },
    { label: "SEMEN1", value: "0.00", unit: "KG", icon: Wheat },
    { label: "SEMEN2", value: "0.00", unit: "KG", icon: Component },
    { label: "AIR", value: "0.00", unit: "L", icon: Droplets }
];

const scheduleData = Array(10).fill({
    noRequest: '',
    noPo: '',
    nama: '',
    lokasi: '',
    mutu: '',
    slump: '',
    volumeRequestM3: '',
    penambahanM3: '',
    terkirimM3: '',
    sisaM3: '',
});

export default function ProduksiPage() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [isJmfDialogOpen, setIsJmfDialogOpen] = useState(false);
  const { user, logout } = useOperatorAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        Memuat data pengguna...
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 bg-gray-800 text-white font-sans p-2 sm:p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-white/10">
            <div className="flex items-center gap-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-headline tracking-wider">Batching Plant Control</h1>
                 <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="bg-gray-700/50 hover:bg-gray-700/80 border-white/10">
                                <Settings className="mr-2 h-4 w-4" />
                                Setting
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-800 text-white border-white/20">
                            <DropdownMenuItem>Tombol manual</DropdownMenuItem>
                            <DropdownMenuItem>timer pintu mixer</DropdownMenuItem>
                            <DropdownMenuItem>urutan loading</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="bg-gray-700/50 hover:bg-gray-700/80 border-white/10">
                        <Droplets className="mr-2 h-4 w-4" />
                        Moisturizer control
                    </Button>
                    <Button variant="outline" className="bg-gray-700/50 hover:bg-gray-700/80 border-white/10" onClick={() => setIsJmfDialogOpen(true)}>
                        <ClipboardList className="mr-2 h-4 w-4" />
                        JMF
                    </Button>
                 </div>
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 text-right p-2 h-auto hover:bg-gray-700/50">
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-primary">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.location}</p>
                        </div>
                        <CircleUser className="w-6 h-6 text-primary" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 text-white border-white/20" align="end">
                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
        
        {/* Indicators Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 flex-shrink-0">
            {indicators.map(indicator => (
                <WeightIndicator key={indicator.label} {...indicator} />
            ))}
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-shrink-0">
            <Card className="lg:col-span-4 bg-gray-900/50 border-white/10 flex flex-col">
                <CardHeader>
                    <CardTitle className='text-center text-lg'>Mode & Operasi</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center justify-center gap-4 sm:gap-6">
                    <Tabs value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')} className="w-full max-w-xs">
                        <TabsList className="grid w-full grid-cols-2 bg-gray-800/80">
                            <TabsTrigger value="auto">AUTO</TabsTrigger>
                            <TabsTrigger value="manual">MANUAL</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="flex items-center gap-4 w-full max-w-sm">
                        <Button className="w-full h-20 bg-green-600/80 hover:bg-green-600 border border-green-400/50 text-white text-xl font-bold flex items-center gap-2 shadow-lg">
                            <Play className="w-8 h-8"/> START
                        </Button>
                        <Button className="w-full h-20 bg-red-600/80 hover:bg-red-600 border border-red-400/50 text-white text-xl font-bold flex items-center gap-2 shadow-lg">
                            <Square className="w-8 h-8"/> STOP
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-4 bg-gray-900/50 border-white/10 flex flex-col">
                 <CardHeader>
                    <CardTitle className='text-center text-lg'>Production Target</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-center gap-2.5 p-4">
                    <ProductionInput label="NO. REQUEST" />
                    <ProductionInput label="NO PO" />
                    <ProductionInput label="PASIR" unit="KG" />
                    <ProductionInput label="BATU" unit="KG" />
                    <ProductionInput label="SEMEN" unit="KG" />
                    <ProductionInput label="AIR" unit="KG" />
                    <div className="border-t border-gray-700 my-2"></div>
                    <ProductionInput label="TARGET VOLUME" />
                    <ProductionInput label="JUMLAH MIXING" />
                </CardContent>
            </Card>

            <Card className="lg:col-span-4 flex-grow bg-gray-900/50 border-white/10 flex flex-col">
                 <CardHeader>
                    <CardTitle className='text-center text-lg'>Kontrol Manual Relay</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-4 gap-2 sm:gap-4">
                    <MaterialButton label="Pasir 1" icon={Gauge} />
                    <MaterialButton label="Pasir 2" icon={Gauge} />
                    <MaterialButton label="Batu 1" icon={Gem} />
                    <MaterialButton label="Batu 2" icon={Gem} />
                    <MaterialButton label="Semen Isi" icon={ArrowDown} />
                    <MaterialButton label="Air Isi" icon={ArrowDown} />
                    <MaterialButton label="Air Buang" icon={ArrowUp} />
                    <MaterialButton label="Semen Buang" icon={ArrowUp} />
                    <MaterialButton label="Konveyor Atas" icon={ArrowUp} />
                    <MaterialButton label="Konveyor Bawah" icon={ArrowDown} />
                    <MaterialButton label="Vibro Pasir" icon={Zap} />
                    <MaterialButton label="Vibro Semen" icon={Zap} />
                    <MaterialButton label="Klakson" icon={Speaker} />
                </CardContent>
            </Card>
        </div>

        {/* Schedule Table Section */}
        <div className="flex-shrink-0">
            <Card className="bg-gray-900/50 border-white/10">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">SCHEDULE COR HARI INI</CardTitle>
                        <div className="flex items-center gap-2">
                           <span className="text-sm text-muted-foreground">TANGGAL:</span>
                           <Input type="text" readOnly value={new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})} className="bg-gray-700/50 border-white/10 w-48 h-8" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table className="border border-gray-600 border-collapse min-w-full">
                            <TableHeader>
                                <TableRow className="bg-gray-700/50">
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">NO. REQUEST</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">NO PO</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">NAMA</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">LOKASI</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">MUTU</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">SLUMP (CM)</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">VOLUME REQUEST M3</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">PENAMBAHAN M3</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">TERKIRIM M3</TableHead>
                                    <TableHead className="border border-gray-600 text-white text-center p-1 h-10">SISA M3</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scheduleData.map((row, index) => (
                                    <TableRow key={index} className="hover:bg-gray-700/30">
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                        <TableCell className="border border-gray-600 p-0 h-10"><Input readOnly className="h-full w-full bg-transparent border-0 text-center focus-visible:ring-0" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
    <JmfDialog isOpen={isJmfDialogOpen} setIsOpen={setIsJmfDialogOpen} />
    </>
  );
}
