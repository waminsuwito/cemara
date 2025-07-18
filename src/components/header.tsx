
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
import { useAppData } from "@/context/app-data-context";

export function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const { user: operatorUser, vehicle: vehicleHullNumber, logout: operatorLogout } = useOperatorAuth();
    const { vehicles } = useAppData();
    
    const isChecklistPage = pathname.startsWith('/checklist') || pathname.startsWith('/select-vehicle');

    const selectedVehicle = vehicleHullNumber ? vehicles.find(v => v.hullNumber === vehicleHullNumber) : null;

    const handleLogout = () => {
        if (isChecklistPage) {
            operatorLogout();
        }
        router.push('/');
    }
  return (
    <header className="sticky top-0 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6 z-50">
      <div className="flex items-center gap-4">
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
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link
            href="#"
            className="flex items-center gap-2 text-lg font-semibold md:text-base"
          >
            <Truck className="h-6 w-6 text-primary" />
            <span className="font-headline">Checklist Harian Alat</span>
          </Link>
        </nav>
      </div>
      
      <div className="flex flex-1 justify-end items-center gap-4">
        {isChecklistPage && operatorUser && (
            <div className="hidden sm:block text-sm text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis text-right">
                Operator: <span className="font-semibold text-primary">{operatorUser.name}</span>
                {selectedVehicle && (
                    <>, Kendaraan: <span className="font-semibold text-primary">{selectedVehicle.licensePlate}</span></>
                )}
            </div>
        )}
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
    </header>
  );
}
