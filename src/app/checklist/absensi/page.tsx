
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck } from "lucide-react";

export default function AbsensiKegiatanPage() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Absensi & Kegiatan</CardTitle>
                <CardDescription>
                    Halaman untuk mengelola absensi dan kegiatan harian Anda.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                    <CalendarCheck className="w-12 h-12 text-muted-foreground" />
                    <p className="mt-4 font-semibold">Fitur Dalam Pengembangan</p>
                    <p className="text-sm text-muted-foreground">
                        Halaman ini sedang dalam tahap pengembangan dan akan segera tersedia.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
