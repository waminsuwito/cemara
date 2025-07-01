
"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";
import type { Vehicle } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function VehicleManagementPage() {
  const { user } = useAdminAuth();
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, locationNames } = useAppData();
  const { toast } = useToast();
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [locationFilter, setLocationFilter] = useState(
    isSuperAdmin ? "all" : user?.location || "all"
  );
  
  const handleAddNew = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleDelete = (vehicleId: string) => {
    deleteVehicle(vehicleId);
  };
  
  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const hullNumber = formData.get("hullNumber") as string;

    // Validation for hullNumber uniqueness
    const isHullNumberTaken = vehicles.some(
      (v) => v.hullNumber.toLowerCase() === hullNumber.toLowerCase() && v.id !== editingVehicle?.id
    );

    if (isHullNumberTaken) {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: `Alat dengan Nomor Lambung ${hullNumber} sudah terdaftar.`,
      });
      return;
    }

    const vehicleData = {
      hullNumber,
      licensePlate: formData.get("licensePlate") as string,
      type: formData.get("type") as string,
      operator: formData.get("operator") as string,
      location: formData.get("location") as string,
    };

    if (editingVehicle) {
      updateVehicle({ ...editingVehicle, ...vehicleData });
    } else {
      addVehicle(vehicleData);
    }
    
    setIsDialogOpen(false);
    setEditingVehicle(null);
  };

  const vehiclesForCurrentUser = isSuperAdmin ? vehicles : vehicles.filter(v => v.location === user?.location);

  const filteredVehicles =
    locationFilter === "all"
      ? vehiclesForCurrentUser
      : vehiclesForCurrentUser.filter((v) => v.location === locationFilter);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Laporan & Alat</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus data alat berat. Laporan dapat dilihat di Dashboard.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter} disabled={!isSuperAdmin}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                {locationNames.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Alat
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Lambung</TableHead>
                <TableHead>Nomor Polisi</TableHead>
                <TableHead>Jenis Alat</TableHead>
                <TableHead>Sopir/Operator</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.hullNumber}</TableCell>
                  <TableCell>{vehicle.licensePlate}</TableCell>
                  <TableCell>{vehicle.type}</TableCell>
                  <TableCell>{vehicle.operator}</TableCell>
                  <TableCell>{vehicle.location}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(vehicle)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat diurungkan. Ini akan menghapus data alat secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(vehicle.id)} className="bg-destructive hover:bg-destructive/90">
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingVehicle ? 'Edit Alat' : 'Tambah Alat Baru'}</DialogTitle>
              <DialogDescription>
                {editingVehicle ? 'Ubah detail alat dan klik simpan.' : 'Isi detail alat baru dan klik tambah.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="hullNumber" className="text-right">
                  No. Lambung
                </Label>
                <Input id="hullNumber" name="hullNumber" defaultValue={editingVehicle?.hullNumber} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="licensePlate" className="text-right">
                  No. Polisi
                </Label>
                <Input id="licensePlate" name="licensePlate" defaultValue={editingVehicle?.licensePlate} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Jenis Alat
                </Label>
                <Input id="type" name="type" defaultValue={editingVehicle?.type} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="operator" className="text-right">
                  Operator
                </Label>
                <Input id="operator" name="operator" defaultValue={editingVehicle?.operator} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Lokasi
                </Label>
                <Select name="location" defaultValue={editingVehicle?.location || user?.location} required disabled={!isSuperAdmin}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih Lokasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationNames.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Batal</Button>
              </DialogClose>
              <Button type="submit">{editingVehicle ? 'Simpan Perubahan' : 'Tambah Alat'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
