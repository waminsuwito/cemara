
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AdminAuthProvider } from '@/context/admin-auth-context';
import { OperatorAuthProvider } from '@/context/operator-auth-context';
import { AppDataProvider } from '@/context/app-data-context';

export const metadata: Metadata = {
  title: 'Checklist Harian Alat',
  description: 'Aplikasi untuk checklist harian kendaraan/alat berat',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#42A5F5" />
      </head>
      <body className="font-body antialiased bg-background">
        <AppDataProvider>
          <AdminAuthProvider>
            <OperatorAuthProvider>
              {children}
            </OperatorAuthProvider>
          </AdminAuthProvider>
        </AppDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
