
"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function SparePartsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spare Parts Digunakan Hari Ini</CardTitle>
        <CardDescription>
            Lihat daftar spare parts yang digunakan untuk perbaikan hari ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <Construction className="h-16 w-16 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Fitur ini sedang dalam pengembangan.</p>
        </div>
      </CardContent>
    </Card>
  );
}
