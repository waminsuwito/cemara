
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Play, Square, Gauge, Wheat, Gem, Droplets, Component } from 'lucide-react';
import { useOperatorAuth } from '@/context/operator-auth-context';

const WeightIndicator = ({ label, value, unit }: { label: string, value: string, unit: string }) => (
    <Card className="text-center bg-background/50 border-white/10">
        <CardHeader className="p-3 md:p-4">
            <CardTitle className="text-base md:text-lg font-medium text-muted-foreground">{label}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
            <p className="text-4xl md:text-5xl font-mono font-bold text-foreground tracking-tighter">
                {value}
            </p>
            <p className="text-sm text-muted-foreground -mt-1">{unit}</p>
        </CardContent>
    </Card>
);

const MaterialButton = ({ label, className, icon: Icon }: { label: string, className?: string, icon?: React.ElementType }) => (
    <Button variant="secondary" className={cn("h-16 text-base flex-col gap-1 shadow-md", className)}>
         {Icon && <Icon className="w-5 h-5 mb-1" />}
         {label}
    </Button>
);

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
    <div className="fixed inset-0 bg-gray-800 text-white font-sans p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex-shrink-0 flex justify-between items-center bg-gray-900/50 p-3 rounded-lg border border-white/10">
            <h1 className="text-xl md:text-2xl font-bold font-headline tracking-wider">My Batching Plant Manager</h1>
            <div className='text-right'>
                <p className="text-sm font-semibold text-primary">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.location}</p>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Left Panel: Indicators */}
            <div className="lg:col-span-1 space-y-4">
                <WeightIndicator label="PASIR" value="0.00" unit="KG" />
                <WeightIndicator label="BATU" value="0.00" unit="KG" />
                <WeightIndicator label="SEMEN1" value="0.00" unit="KG" />
                <WeightIndicator label="SEMEN2" value="0.00" unit="KG" />
                <WeightIndicator label="AIR" value="0.00" unit="L" />
            </div>

            {/* Right Panel: Controls */}
            <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Top Controls: Mode, Start, Stop */}
                <Card className="bg-gray-900/50 border-white/10">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <Tabs value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')} className="w-full md:w-auto">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="auto">AUTO</TabsTrigger>
                                <TabsTrigger value="manual">MANUAL</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <Button className="w-full h-16 bg-green-600 hover:bg-green-700 text-white text-xl font-bold flex items-center gap-2 shadow-lg">
                                <Play className="w-8 h-8"/> START
                            </Button>
                            <Button className="w-full h-16 bg-red-600 hover:bg-red-700 text-white text-xl font-bold flex items-center gap-2 shadow-lg">
                                <Square className="w-8 h-8"/> STOP
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Material Controls */}
                <Card className="flex-grow bg-gray-900/50 border-white/10">
                     <CardHeader>
                        <CardTitle className='text-center text-lg'>Kontrol Material (Manual)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
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
    </div>
  );
}
