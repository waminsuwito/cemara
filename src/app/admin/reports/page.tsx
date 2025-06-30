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

type Vehicle = {
  id: number;
  hullNumber: string;
  licensePlate: string;
  type: string;
  operator: string;
  location: string;
};

const initialVehicles: Vehicle[] = [
  { id: 1, hullNumber: "EX-01", licensePlate: "B 1234 ABC", type: "Excavator", operator: "Umar Santoso", location: "Site A" },
  { id: 2, hullNumber: "DT-05", licensePlate: "B 5678 DEF", type: "Dump Truck", operator: "Aep Saefudin", location: "Site B" },
  { id: 3, hullNumber: "BD-02", licensePlate: "B 9012 GHI", type: "Bulldozer", operator: "Amirul", location: "Site A" },
  { id: 4, hullNumber: "GD-03", licensePlate: "B 3456 JKL", type: "Grader", operator: "Solihin", location: "Site C" },
  { id: 5, hullNumber: "CP-01", licensePlate: "B 7890 MNO", type: "Compactor", operator: "Siswanto", location: "Site B" },
];

export default function VehicleManagementPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
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
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Alat
          </Button>
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
              {vehicles.map((vehicle) => (
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
