
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AdminAuthProvider } from '@/context/admin-auth-context';
import { OperatorAuthProvider } from '@/context/operator-auth-context';
import { AppDataProvider } from '@/context/app-data-context';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});


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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#42A5F5" />
      </head>
      <body className="font-body antialiased bg-background">
        <AdminAuthProvider>
          <OperatorAuthProvider>
            <AppDataProvider>
              {children}
            </AppDataProvider>
          </OperatorAuthProvider>
        </AdminAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
