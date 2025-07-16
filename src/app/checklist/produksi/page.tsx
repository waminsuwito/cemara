
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Factory } from "lucide-react";

export default function ProduksiPage() {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Halaman Produksi</CardTitle>
        <CardDescription>
          Halaman ini digunakan untuk mengelola data produksi dari Batching Plant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-lg">
          <Factory className="w-16 h-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-semibold text-muted-foreground">
            Fitur Produksi Segera Hadir
          </p>
          <p className="text-sm text-muted-foreground">
            Fungsionalitas untuk halaman ini sedang dalam pengembangan.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
