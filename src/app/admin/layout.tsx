
"use client";

import Link from "next/link";
import React from 'react';
import {
  CircleUser,
  Home,
  LineChart,
  Menu,
  Truck,
  Users,
  MapPin,
  Wrench,
  LogOut,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/context/admin-auth-context";

const navItems = [
  { href: "/admin/dashboard", icon: Home, label: "Dashboard", roles: ['SUPER_ADMIN', 'LOCATION_ADMIN'] },
  { href: "/admin/reports", icon: Wrench, label: "Manajemen Alat", roles: ['SUPER_ADMIN', 'LOCATION_ADMIN'] },
  { href: "/admin/locations", icon: MapPin, label: "Manajemen Lokasi", roles: ['SUPER_ADMIN'] },
  { href: "/admin/users", icon: Users, label: "Manajemen Pengguna", roles: ['SUPER_ADMIN'] },
  { href: "/admin/analysis", icon: LineChart, label: "Laporan dan Analisis", roles: ['SUPER_ADMIN', 'LOCATION_ADMIN'] },
];

const NavLink = ({ href, icon: Icon, label }: {href: string, icon: React.ElementType, label: string}) => {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-primary/10 text-primary font-semibold shadow-inner-glow"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
};

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAdminAuth();
  
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
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
  
  const accessibleNavItems = navItems.filter(item => item.roles.includes(user.role as 'SUPER_ADMIN' | 'LOCATION_ADMIN'));

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/20 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Truck className="h-6 w-6 text-primary" />
              <span className="font-headline">Checklist Harian Alat</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {accessibleNavItems.map((item) => (
                <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
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
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Truck className="h-6 w-6 text-primary" />
                  <span className="sr-only">Checklist Harian Alat</span>
                </Link>
                {accessibleNavItems.map((item) => (
                  <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
                ))}
              </nav>
              <div className="mt-auto">
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


export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutContent>{children}</AdminLayoutContent>
  );
}
