
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrintHeader() {
    const router = useRouter();

    const handlePrint = () => {
        window.print();
    };

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
            <h1 className="text-xl font-semibold">Pratinjau Cetak Laporan</h1>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Kembali
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Cetak Halaman Ini
                </Button>
            </div>
        </header>
    );
}
