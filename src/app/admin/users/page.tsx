import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h3>
        <p className="text-sm text-muted-foreground">
          Halaman ini akan digunakan untuk mengelola data operator dan admin.
        </p>
      </div>
    </div>
  );
}
