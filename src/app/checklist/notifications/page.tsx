
"use client";

import { useMemo, useEffect } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Inbox, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { useAppData } from "@/context/app-data-context";
import { useOperatorAuth } from "@/context/operator-auth-context";
import type { Notification } from "@/lib/data";

const getNotificationStyle = (type?: Notification['type']) => {
    switch (type) {
        case 'DAMAGE':
            return {
                Icon: AlertTriangle,
                iconBg: 'bg-destructive',
                iconColor: 'text-destructive-foreground',
                titleColor: 'text-destructive'
            };
        case 'SUCCESS':
            return {
                Icon: CheckCircle2,
                iconBg: 'bg-green-500',
                iconColor: 'text-white',
                titleColor: 'text-green-500'
            };
        case 'PENALTY':
             return {
                Icon: ShieldAlert,
                iconBg: 'bg-yellow-500',
                iconColor: 'text-white',
                titleColor: 'text-yellow-500'
            };
        default:
            return {
                Icon: Bell,
                iconBg: 'bg-primary',
                iconColor: 'text-primary-foreground',
                titleColor: ''
            };
    }
};

export default function NotificationsPage() {
  const { notifications, markNotificationsAsRead } = useAppData();
  const { user } = useOperatorAuth();

  const myNotifications = useMemo(() => {
    if (!user) return [];
    return notifications.filter(n => n.userId === user.id);
  }, [notifications, user]);

  useEffect(() => {
    if (user) {
      markNotificationsAsRead(user.id);
    }
  }, [user, markNotificationsAsRead]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Pesan Masuk</CardTitle>
        <CardDescription>
          Semua pesan, notifikasi, dan pembaruan penting akan ditampilkan di sini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {myNotifications.length > 0 ? (
          <div className="space-y-4">
            {myNotifications.map(notification => {
              const { Icon, iconBg, iconColor, titleColor } = getNotificationStyle(notification.type);
              return (
                <div key={notification.id} className={`flex items-start gap-4 p-4 border rounded-lg transition-opacity ${notification.isRead ? 'opacity-60' : 'opacity-100'}`}>
                    <div className={`mt-1 p-2 rounded-full ${iconBg}`}>
                        <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div>
                        <p className={`font-semibold ${titleColor}`}>{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {notification.timestamp ? format(new Date(notification.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID }) : 'Baru saja'}
                        </p>
                    </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
            <Inbox className="w-12 h-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Belum ada pesan baru.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
