import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function AnalysisPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <LineChart className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight">Laporan dan Analisis</h3>
        <p className="text-sm text-muted-foreground">
          Halaman ini akan menampilkan analisis dan visualisasi data dari laporan.
        </p>
      </div>
    </div>
  );
}
