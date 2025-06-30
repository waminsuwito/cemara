"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

// This is a dedicated component for the print button to isolate its functionality.

export function PrintHeader({ selectedLocation }: { selectedLocation: string }) {

    const handlePrint = () => {
        // 1. Find the specific container we want to print
        const printContainer = document.querySelector('.print-page-container');
        if (!printContainer) {
            alert("Gagal menemukan konten untuk dicetak.");
            return;
        }
        const contentToPrint = printContainer.innerHTML;

        // 2. Get all style and link tags from the original document's head
        const headContent = Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(el => el.outerHTML)
            .join('');

        // 3. Open a new, blank window
        const printWindow = window.open('', '', 'height=800,width=1000');

        if (printWindow) {
            // 4. Write a new HTML document to the window
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Cetak Laporan</title>
                        ${headContent}
                    </head>
                    <body>
                        ${contentToPrint}
                    </body>
                </html>
            `);
            printWindow.document.close();

            // 5. Wait for the content to load, then trigger the print dialog
            setTimeout(() => {
                printWindow.focus();
                printWindow.print();
                printWindow.close();
            }, 500); // 0.5 second delay for rendering
        } else {
            alert("Pop-up blocker mungkin menghalangi dialog cetak. Mohon izinkan pop-up untuk situs ini.");
        }
    };

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
                {/* Using a standard HTML button with a robust print handler */}
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
