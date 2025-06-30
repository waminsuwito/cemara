
"use client";

import { useState } from "react";
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

type Vehicle = {
  id: number;
  hullNumber: string;
  licensePlate: string;
  type: string;
  operator: string;
  location: string;
};

const initialVehicles: Vehicle[] = [
  { id: 1, hullNumber: "TM-01", licensePlate: "B 1111 TMX", type: "Truck mixer", operator: "Budi", location: "BP Pekanbaru" },
  { id: 2, hullNumber: "DT-01", licensePlate: "B 2222 DTK", type: "Dump Truck", operator: "Charlie", location: "BP Baung" },
  { id: 3, hullNumber: "CP-01", licensePlate: "B 3333 CPP", type: "CP", operator: "Dedi", location: "BP Dumai" },
  { id: 4, hullNumber: "EX-01", licensePlate: "B 4444 EXV", type: "Exavator", operator: "Eko", location: "BP IKN" },
  { id: 5, hullNumber: "FK-01", licensePlate: "B 5555 FKK", type: "Foco kren", operator: "Fahri", location: "BP Pekanbaru" },
  { id: 6, hullNumber: "GS-01", licensePlate: "B 6666 GST", type: "Genset", operator: "Gilang", location: "BP Baung" },
  { id: 7, hullNumber: "BP-01", licensePlate: "B 7777 BPP", type: "BP", operator: "Hadi", location: "BP Dumai" },
  { id: 8, hullNumber: "KI-01", licensePlate: "B 8888 KIV", type: "Kendaraan Inventaris", operator: "Iwan", location: "BP IKN" },
  { id: 9, hullNumber: "KT-01", licensePlate: "B 9999 KTS", type: "Kapsul Semen", operator: "Joko", location: "BP Pekanbaru" },
];

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  
  const handleAddNew = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleDelete = (vehicleId: number) => {
    setVehicles(vehicles.filter((v) => v.id !== vehicleId));
  };
  
  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const vehicleData = {
      hullNumber: formData.get("hullNumber") as string,
      licensePlate: formData.get("licensePlate") as string,
      type: formData.get("type") as string,
      operator: formData.get("operator") as string,
      location: formData.get("location") as string,
    };

    if (editingVehicle) {
      // Update existing vehicle
      setVehicles(vehicles.map((v) => v.id === editingVehicle.id ? { ...v, ...vehicleData } : v));
    } else {
      // Add new vehicle
      const newVehicle = { id: Date.now(), ...vehicleData };
      setVehicles([...vehicles, newVehicle]);
    }
    
    setIsDialogOpen(false);
    setEditingVehicle(null);
  };

  const uniqueLocations = [...new Set(vehicles.map((v) => v.location))];

  const filteredVehicles =
    locationFilter === "all"
      ? vehicles
      : vehicles.filter((v) => v.location === locationFilter);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Alat</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus data alat berat.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                {uniqueLocations.map((location) => (
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
                <Input id="location" name="location" defaultValue={editingVehicle?.location} className="col-span-3" required />
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
