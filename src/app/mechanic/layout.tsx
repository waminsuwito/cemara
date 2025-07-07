
"use client";

import Link from "next/link";
import React from 'react';
import {
  CircleUser,
  Menu,
  LogOut,
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Users,
  ClipboardCheck,
  History,
  ShieldAlert,
  Inbox,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/context/admin-auth-context";

const navItems = [
  { href: "/mechanic/dashboard", icon: LayoutDashboard, label: "Alat Rusak Hari Ini" },
  { href: "/mechanic/tasks", icon: ClipboardList, label: "Work Order (WO) Saya Hari Ini" },
  { href: "/mechanic/completed-tasks", icon: ClipboardCheck, label: "Realisasi Pekerjaan Hari Ini" },
  { href: "/mechanic/repair-history", icon: History, label: "Histori Perbaikan Alat" },
  { href: "/mechanic/members", icon: Users, label: "Anggota Mekanik" },
  { href: "/mechanic/penalty", icon: ShieldAlert, label: "Riwayat Penalti Saya", className: "text-destructive hover:text-destructive/90" },
  { href: "/mechanic/notifications", icon: Inbox, label: "Pesan Masuk" },
];

const NavLink = ({ href, icon: Icon, label, className }: {href: string, icon: React.ElementType, label: string, className?: string}) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-primary/10 text-primary font-semibold shadow-inner-glow",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

function MechanicLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAdminAuth();
  
  React.useEffect(() => {
    if (!isLoading && (!user || (user.role !== 'MEKANIK' && user.role !== 'SUPER_ADMIN'))) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  if (isLoading || !user || (user.role !== 'MEKANIK' && user.role !== 'SUPER_ADMIN')) {
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
            <Link href="/mechanic/dashboard" className="flex items-center gap-2 font-semibold">
              <Wrench className="h-6 w-6 text-primary" />
              <span className="font-headline">Dasbor Mekanik</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4 py-4">
              {navItems.map((item) => (
                <NavLink key={item.href} {...item} />
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
        </div>
      </div>
      <div className="flex flex-col">
        <header className="relative flex h-14 items-center gap-4 border-b bg-muted/20 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col bg-card/95 backdrop-blur-sm">
              <div className="flex-1 overflow-y-auto">
                <nav className="grid gap-2 text-lg font-medium">
                  <SheetHeader className="p-0 text-left mb-4">
                    <SheetTitle>
                      <Link
                        href="#"
                        className="flex items-center gap-2 text-lg font-semibold"
                      >
                        <Wrench className="h-6 w-6 text-primary" />
                        <span>Dasbor Mekanik</span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  {navItems.map((item) => (
                     <NavLink key={item.href} {...item} />
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
             <div className="text-sm text-muted-foreground">
                Role: <span className="font-semibold text-primary">{user.role}</span>
                {user.location && (
                    <>
                    , Lokasi: <span className="font-semibold text-primary">{user.location}</span>
                    </>
                )}
            </div>
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
              <DropdownMenuLabel>{user.username}</DropdownMenuLabel>
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

export default function MechanicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MechanicLayoutContent>{children}</MechanicLayoutContent>
  );
}
