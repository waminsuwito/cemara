
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";

export default function NotificationsPage() {
  const { notifications, users } = useAppData();
  const { user: adminUser } = useAdminAuth();

  const myNotifications = useMemo(() => {
    if (!adminUser) return [];

    // Admins need to see notifications for all users in their scope
    if (adminUser.role === 'SUPER_ADMIN') {
        // Super admin sees all notifications for all admin-level users
        const adminRoles: string[] = ['SUPER_ADMIN', 'LOCATION_ADMIN', 'MEKANIK', 'LOGISTIK'];
        const adminUserIds = new Set(users.filter(u => adminRoles.includes(u.role)).map(u => u.id));
        return notifications.filter(n => adminUserIds.has(n.userId));
    }

    if (adminUser.role === 'LOCATION_ADMIN' && adminUser.location) {
        // Location admin sees notifications for all users in their location
        const userIdsInLocation = new Set(users.filter(u => u.location === adminUser.location).map(u => u.id));
        return notifications.filter(n => userIdsInLocation.has(n.userId));
    }
    
    return [];
  }, [notifications, adminUser, users]);

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
