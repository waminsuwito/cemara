
"use client";

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
import { cn } from "@/lib/utils";
import { CircleUser, LogOut, Menu, Truck } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAdminAuth } from "@/context/admin-auth-context";

export function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user: operatorUser, logout: operatorLogout } = useOperatorAuth();
    
    // The admin layout has its own header, so this is primarily for the operator checklist page.
    const isChecklistPage = pathname.startsWith('/checklist');

    const handleLogout = () => {
        if (isChecklistPage) {
            operatorLogout();
        }
        router.push('/');
    }
  return (
    <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
        >
          <Truck className="h-6 w-6 text-primary" />
          <span className="font-headline">Checklist Harian Alat</span>
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Truck className="h-6 w-6 text-primary" />
              <span className="sr-only">Checklist Harian Alat</span>
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex w-full items-center justify-between gap-4 md:ml-auto md:gap-2 lg:gap-4">
        {isChecklistPage && operatorUser && (
            <div className="flex-1 text-sm text-muted-foreground">
                Operator: <span className="font-semibold text-primary">{operatorUser.name}</span>, 
                Kendaraan: <span className="font-semibold text-primary">{operatorUser.batangan}</span>
            </div>
        )}
        <div className="flex items-center gap-4">
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{operatorUser?.name || 'My Account'}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>Settings</DropdownMenuItem>
                <DropdownMenuItem disabled>Support</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
