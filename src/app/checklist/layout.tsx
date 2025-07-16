
"use client";

import Link from "next/link";
import React, { useMemo } from 'react';
import {
  CircleUser,
  Menu,
  Truck,
  LogOut,
  History,
  MessageSquareWarning,
  Lightbulb,
  ClipboardCheck,
  KeyRound,
  ClipboardList,
  ShieldAlert,
  Inbox,
  Users,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NavLink = ({ href, icon: Icon, label, className, hasBadge }: {href: string, icon: React.ElementType, label: string, className?: string, hasBadge?: boolean}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-primary/10 text-primary font-semibold shadow-inner-glow",
        className
      )}
    >
       {hasBadge && (
        <span className="absolute left-1 top-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

export default function OperatorLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, vehicle, logout, isLoading, selectVehicle } = useOperatorAuth();
  const { vehicles, notifications } = useAppData();
  
  const selectedVehicle = React.useMemo(() => {
    if (!vehicle) return null;
    return vehicles.find(v => v.hullNumber === vehicle);
  }, [vehicle, vehicles]);

  const availableVehicles = useMemo(() => {
    if (!user?.batangan) return [];
    const batanganList = user.batangan.split(',').map(b => b.trim().toLowerCase());
    return vehicles
      .filter(v => batanganList.includes(v.licensePlate.trim().toLowerCase()))
      .sort((a, b) => a.licensePlate.localeCompare(b.licensePlate));
  }, [user, vehicles]);

  const unreadCount = React.useMemo(() => {
    if (!user) return 0;
    return notifications.filter(n => n.userId === user.id && !n.isRead).length;
  }, [user, notifications]);

  const handleVehicleChange = (hullNumber: string) => {
    if (hullNumber) {
      selectVehicle(hullNumber);
    }
  };

  const navItems = React.useMemo(() => {
    const baseItems = [
      { href: "/checklist", icon: ClipboardCheck, label: "Checklist Harian" },
      { href: "/checklist/absensi", icon: CalendarCheck, label: "Absensi & Kegiatan" },
      { href: "/checklist/complaint", icon: MessageSquareWarning, label: "Komplain" },
      { href: "/checklist/suggestion", icon: Lightbulb, label: "Usulan/Saran" },
      { href: "/checklist/history", icon: History, label: "Riwayat Saya" },
      { href: "/checklist/change-password", icon: KeyRound, label: "Ganti Password" },
      { href: "/checklist/penalty", icon: ShieldAlert, label: "Riwayat Penalti Saya", className: "text-destructive hover:text-destructive/90" },
      { href: "/checklist/notifications", icon: Inbox, label: "Pesan Masuk" },
    ];

    if (user?.role === 'KEPALA_BP') {
      baseItems.unshift({ href: "/checklist/select-vehicle", icon: ClipboardList, label: "Daftar Batangan Saya" });
      baseItems.unshift({ href: "/checklist/armada", icon: Users, label: "Daftar Armada" });
    }

    return baseItems;
  }, [user]);

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Memuat...
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/20 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/checklist" className="flex items-center gap-2 font-semibold">
              <Truck className="h-6 w-6 text-primary" />
              <span className="font-headline">Checklist Operator</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
              {navItems.map((item) => (
                <NavLink 
                  key={item.href} 
                  {...item}
                  hasBadge={item.label === 'Pesan Masuk' && unreadCount > 0}
                />
              ))}
            </nav>
          </div>
          <div className="p-4 border-t">
            <div className="pb-4 text-center">
              <img
                src="https://i.ibb.co/V0NgdX7z/images.jpg"
                alt="Logo PT Farika Riau Perkasa"
                className="h-20 w-20 object-contain mx-auto"
              />
            </div>
            <Button size="sm" className="w-full" onClick={handleLogout} variant="secondary">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="relative flex h-14 items-center gap-4 border-b bg-muted/20 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-card/95 backdrop-blur-sm">
              <div className="flex-1 overflow-y-auto">
                <nav className="grid gap-2 text-lg font-medium">
                  <SheetHeader className="p-0 text-left mb-4">
                    <SheetTitle>
                      <Link href="/checklist" className="flex items-center gap-2 text-lg font-semibold">
                        <Truck className="h-6 w-6 text-primary" />
                        <span>Checklist Operator</span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  {navItems.map((item) => (
                     <NavLink 
                      key={item.href} 
                      {...item}
                      hasBadge={item.label === 'Pesan Masuk' && unreadCount > 0}
                    />
                  ))}
                </nav>
              </div>
              <div className="p-4 border-t mt-auto">
                 <div className="pb-4 text-center">
                   <img
                     src="https://i.ibb.co/V0NgdX7z/images.jpg"
                     alt="Logo PT Farika Riau Perkasa"
                     className="h-20 w-20 object-contain mx-auto"
                   />
                 </div>
                 <Button size="sm" className="w-full" onClick={handleLogout} variant="secondary">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
             {user.role === 'KEPALA_BP' ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-sm text-muted-foreground hidden lg:block">
                    Kepala BP: <span className="font-semibold text-primary">{user.name}</span>
                  </div>
                   <Select value={vehicle || ""} onValueChange={handleVehicleChange}>
                    <SelectTrigger className="w-full max-w-[280px] text-sm h-9">
                      <SelectValue placeholder="Pilih Kendaraan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles.map(v => (
                        <SelectItem key={v.id} value={v.hullNumber}>
                          {v.licensePlate} ({v.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                    Operator: <span className="font-semibold text-primary">{user.name}</span>
                    {selectedVehicle && (
                        <>
                        , Kendaraan: <span className="font-semibold text-primary">{selectedVehicle.type} ({selectedVehicle.licensePlate})</span>
                        </>
                    )}
                </div>
              )}
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
            <p className="font-semibold text-primary tracking-wider whitespace-nowrap">
              PT FARIKA RIAU PERKASA
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5 text-primary" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
