"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

// This is a dedicated component for the print button to isolate its functionality.
// It directly calls window.print() on a standard button element.

export function PrintHeader({ selectedLocation }: { selectedLocation: string }) {

    const handlePrint = () => {
        // Direct call to the browser's print API.
        window.print();
    }

    return (
        <header className="bg-white shadow-md p-4 flex justify-between items-center print-hide">
            <h1 className="text-xl font-semibold">Pratinjau Cetak Laporan</h1>
            <div className="flex gap-2">
                <Link 
                    href={`/admin/dashboard?location=${selectedLocation}`}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                    <ArrowLeft className="h-4 w-4 shrink-0" />
                    Kembali ke Dasbor
                </Link>
                {/* Using a standard HTML button to avoid any React component interference. */}
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-primary/50 hover:shadow-[0_0_15px_var(--primary)] h-10 px-4 py-2"
                >
                    <Printer className="h-4 w-4 shrink-0" />
                    Cetak Laporan
                </button>
            </div>
        </header>
    );
}
