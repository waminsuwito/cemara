
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pemberitahuan</CardTitle>
        <CardDescription>
          Semua notifikasi dan pembaruan penting akan ditampilkan di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
          <Bell className="w-12 h-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Belum ada pemberitahuan baru.</p>
        </div>
      </CardContent>
    </Card>
  );
}
