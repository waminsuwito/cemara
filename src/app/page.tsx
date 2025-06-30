
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OperatorLoginForm } from "@/components/operator-login-form";
import { AdminLoginForm } from "@/components/admin-login-form";
import { Truck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-6 bg-gradient-to-br from-background via-gray-900/50 to-background">
      <div className="w-full max-w-md">
        <div className="flex justify-center items-center gap-4 mb-6">
          <Truck className="h-10 w-10 text-primary" />
          <h1 className="text-3xl font-bold text-center text-foreground font-headline">
            Checklis Harian Alat
          </h1>
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
