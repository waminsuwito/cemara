
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useAppData } from "@/context/app-data-context";
import { useOperatorAuth } from "@/context/operator-auth-context";

export default function NotificationsPage() {
  const { notifications } = useAppData();
  const { user } = useOperatorAuth();

  const myNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter(n => n.userId === user.id);
  }, [notifications, user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pemberitahuan</CardTitle>
        <CardDescription>
          Semua notifikasi dan pembaruan penting akan ditampilkan di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {myNotifications.length > 0 ? (
          <div className="space-y-4">
            {myNotifications.map(notification => (
              <div key={notification.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className={`mt-1 p-2 rounded-full ${notification.isRead ? 'bg-muted' : 'bg-primary'}`}>
                    <Bell className={`w-5 h-5 ${notification.isRead ? 'text-muted-foreground' : 'text-primary-foreground'}`} />
                </div>
                <div>
                  <p className="font-semibold">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {notification.timestamp ? format(new Date(notification.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID }) : 'Baru saja'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
            <Bell className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Belum ada pemberitahuan baru.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
