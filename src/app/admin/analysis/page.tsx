
"use client";

import React, { useMemo, useState, useRef } from "react";
import ReactToPrint from "react-to-print";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";
import { isSameDay, isBefore, startOfToday, format } from "date-fns";
import { Printer } from "lucide-react";
import type { Vehicle } from "@/lib/data";

const chartConfig = {
  baik: { label: "Baik", color: "hsl(var(--chart-2))" },
  perluPerhatian: { label: "Perlu Perhatian", color: "hsl(var(--accent))" },
  rusak: { label: "Rusak", color: "hsl(var(--destructive))" },
  belumChecklist: { label: "Belum Checklist", color: "hsl(var(--secondary))" },
} satisfies ChartConfig;

// Converted to a class component to fix a compatibility issue with react-to-print and findDOMNode in React 18.
class PrintableReport extends React.Component<{ vehicles: (Vehicle & { status: string })[] }> {
  render() {
    const { vehicles } = this.props;
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Laporan Kondisi Alat</h1>
        <p className="text-center mb-6">Tanggal Cetak: {format(new Date(), 'dd MMMM yyyy')}</p>
        <table className="w-full text-sm border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Lokasi BP</th>
              <th className="border border-gray-300 p-2 text-left">No Lambung</th>
              <th className="border border-gray-300 p-2 text-left">No Pol</th>
              <th className="border border-gray-300 p-2 text-left">Nama Sopir/Operator</th>
              <th className="border border-gray-300 p-2 text-left">Kondisi Alat</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.length > 0 ? vehicles.map(vehicle => (
              <tr key={vehicle.id} className="even:bg-gray-50">
                <td className="border border-gray-300 p-2">{vehicle.location}</td>
                <td className="border border-gray-300 p-2">{vehicle.hullNumber}</td>
                <td className="border border-gray-300 p-2">{vehicle.licensePlate}</td>
                <td className="border border-gray-300 p-2">{vehicle.operator}</td>
                <td className="border border-gray-300 p-2">{vehicle.status}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="border border-gray-300 p-2 text-center">Tidak ada data untuk ditampilkan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }
}

export default function AnalysisPage() {
  const { user } = useAdminAuth();
  const { vehicles, reports, locationNames } = useAppData();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [selectedLocation, setSelectedLocation] = useState(
    isSuperAdmin ? "all" : user?.location || "all"
  );
  
  const reportRef = useRef<PrintableReport>(null);

  const vehiclesWithStatus = useMemo(() => {
    const today = startOfToday();
    return vehicles.map(vehicle => {
      const reportsForVehicle = reports
        .filter(r => r.vehicleId === vehicle.hullNumber)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      const latestReport = reportsForVehicle[0];
      let status = 'Belum Checklist';

      if (latestReport) {
        const reportDate = new Date(latestReport.timestamp);
        if (isSameDay(reportDate, today)) {
          status = latestReport.overallStatus;
        } else if (isBefore(reportDate, today)) {
          if (latestReport.overallStatus === 'Rusak' || latestReport.overallStatus === 'Perlu Perhatian') {
            status = latestReport.overallStatus;
          }
        }
      }
      return { ...vehicle, status };
    });
  }, [vehicles, reports]);

  const filteredVehiclesForReport = useMemo(() => {
    const vehiclesForUser = isSuperAdmin
      ? vehiclesWithStatus
      : vehiclesWithStatus.filter(v => v.location === user?.location);

    if (selectedLocation === 'all') {
        return vehiclesForUser;
    }

    return vehiclesForUser.filter(v => v.location === selectedLocation);
  }, [vehiclesWithStatus, isSuperAdmin, user?.location, selectedLocation]);

  const chartData = useMemo(() => {
    const dataByLocation = locationNames.reduce((acc, loc) => {
        if (!acc[loc]) {
            acc[loc] = { location: loc, baik: 0, perluPerhatian: 0, rusak: 0, belumChecklist: 0 };
        }
        return acc;
    }, {} as Record<string, any>);

    vehiclesWithStatus.forEach(vehicle => {
        if (dataByLocation[vehicle.location]) {
            if (vehicle.status === 'Baik') dataByLocation[vehicle.location].baik++;
            else if (vehicle.status === 'Perlu Perhatian') dataByLocation[vehicle.location].perluPerhatian++;
            else if (vehicle.status === 'Rusak') dataByLocation[vehicle.location].rusak++;
            else if (vehicle.status === 'Belum Checklist') dataByLocation[vehicle.location].belumChecklist++;
        }
    });
    
    const allData = Object.values(dataByLocation);

    if (!isSuperAdmin) {
        return allData.filter(d => d.location === user?.location);
    }

    if (selectedLocation === 'all') {
        return allData;
    }

    return allData.filter(d => d.location === selectedLocation);

  }, [vehiclesWithStatus, locationNames, isSuperAdmin, user?.location, selectedLocation]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Analisis Kondisi Alat</CardTitle>
            <CardDescription>
              Grafik yang menampilkan ringkasan kondisi alat berat per lokasi.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pilih Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Lokasi</SelectItem>
                  {locationNames.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
             <ReactToPrint
                trigger={() => (
                    <Button>
                        <Printer className="mr-2 h-4 w-4" />
                        Print Laporan
                    </Button>
                )}
                content={() => reportRef.current}
                documentTitle={`Laporan-Kondisi-Alat-${selectedLocation}-${format(new Date(), 'yyyy-MM-dd')}`}
            />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
              <BarChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="location"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <YAxis allowDecimals={false} />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <ChartLegend />
                <Bar dataKey="baik" fill="var(--color-baik)" radius={4} />
                <Bar dataKey="perluPerhatian" fill="var(--color-perluPerhatian)" radius={4} />
                <Bar dataKey="rusak" fill="var(--color-rusak)" radius={4} />
                <Bar dataKey="belumChecklist" fill="var(--color-belumChecklist)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex h-[400px] w-full items-center justify-center text-muted-foreground">
              Tidak ada data untuk ditampilkan.
            </div>
          )}
        </CardContent>
      </Card>
      <div className="hidden">
        <PrintableReport ref={reportRef} vehicles={filteredVehiclesForReport} />
      </div>
    </>
  );
}
