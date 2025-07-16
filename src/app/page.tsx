"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedLoginForm } from "@/components/unified-login-form";
import { UserTie, Loader2 } from "lucide-react";
import { useAppData } from "@/context/app-data-context";

export default function Home() {
  const { isDataLoaded } = useAppData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-3 mt-4">
            <UserTie className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground font-headline">
              My Batching Plant Manager
            </h1>
          </div>
        </div>

        {!isDataLoaded ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Memuat data aplikasi...</p>
          </div>
        ) : (
          <Card className="bg-card/80 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle>Login Sistem</CardTitle>
              <CardDescription>
                Masukkan Username, NIK, atau Nama Anda untuk melanjutkan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedLoginForm />
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
