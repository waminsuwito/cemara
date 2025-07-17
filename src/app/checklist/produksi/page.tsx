
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Play, Square, Gauge, Wheat, Gem, Droplets, Component, Settings } from 'lucide-react';
import { useOperatorAuth } from '@/context/operator-auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const indicators = [
    { label: "PASIR", value: "0.00", unit: "KG", icon: Gauge },
    { label: "BATU", value: "0.00", unit: "KG", icon: Gem },
    { label: "SEMEN1", value: "0.00", unit: "KG", icon: Wheat },
    { label: "SEMEN2", value: "0.00", unit: "KG", icon: Component },
    { label: "AIR", value: "0.00", unit: "L", icon: Droplets }
];

export default function ProduksiPage() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const { user } = useOperatorAuth();

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900 text-white">
        Memuat data pengguna...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-800 text-white font-sans p-2 sm:p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-white/10">
            <div className="flex items-center gap-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold font-headline tracking-wider">Batching Plant Control</h1>
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
            </div>
            <div className='text-right'>
                <p className="text-sm font-semibold text-primary">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.location}</p>
            </div>
        </div>
        
        {/* Indicators Section */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            {indicators.map(indicator => (
                <WeightIndicator key={indicator.label} {...indicator} />
            ))}
        </div>

        {/* Controls Section */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gray-900/50 border-white/10 flex flex-col">
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

            <Card className="flex-grow bg-gray-900/50 border-white/10 flex flex-col">
                 <CardHeader>
                    <CardTitle className='text-center text-lg'>Kontrol Material (Manual)</CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
                    <MaterialButton label="Pasir 1" icon={Gauge} />
                    <MaterialButton label="Pasir 2" icon={Gauge} />
                    <MaterialButton label="Batu 1" icon={Gem} />
                    <MaterialButton label="Batu 2" icon={Gem} />
                    <MaterialButton label="Semen 1" icon={Wheat} />
                    <MaterialButton label="Semen 2" icon={Component} />
                    <MaterialButton label="Air" icon={Droplets} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
