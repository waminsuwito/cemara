
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperatorLoginForm } from "@/components/operator-login-form";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Truck } from "lucide-react";

export default function Home() {
  const logoUrl = "https://i.ibb.co/68z01P6/logo-farika.png";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6 bg-background">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
           <img
            src={logoUrl}
            alt="Logo PT Farika Riau Perkasa"
            width={128}
            height={128}
            className="mb-4"
          />
          <p className="text-lg font-semibold text-primary tracking-wider">
            PT FARIKA RIAU PERKASA
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Truck className="h-10 w-10 text-primary" />
            <h1 className="text-3xl font-bold text-foreground font-headline">
              Checklist Harian Alat
            </h1>
          </div>
        </div>
        <Tabs defaultValue="operator" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="operator">Operator/Driver</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
          <TabsContent value="operator">
            <Card className="bg-card/80 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>Login Operator</CardTitle>
                <CardDescription>
                  Masukan NIK/Nama dan password untuk memulai checklist harian.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <OperatorLoginForm />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="admin">
            <Card className="bg-card/80 backdrop-blur-sm border-white/10">
              <CardHeader>
                <CardTitle>Login Admin</CardTitle>
                <CardDescription>
                  Masukan username dan password untuk memonitor laporan.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminLoginForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
