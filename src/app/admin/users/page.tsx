
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

type User = {
  id: number;
  name: string;
  nik: string;
  password: string;
  batangan: string;
  location: string;
};

const initialUsers: User[] = [
  { id: 1, name: "Umar Santoso", nik: "1001", password: "password", batangan: "EX-01", location: "BP Pekanbaru" },
  { id: 2, name: "Aep Saefudin", nik: "1002", password: "password", batangan: "DT-05", location: "BP Baung" },
  { id: 3, name: "Amirul", nik: "1003", password: "password", batangan: "BD-02", location: "BP Dumai" },
  { id: 4, name: "Solihin", nik: "1004", password: "password", batangan: "GD-03", location: "BP IKN" },
  { id: 5, name: "Siswanto", nik: "1005", password: "password", batangan: "CP-01", location: "BP Pekanbaru" },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const handleAddNew = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: number) => {
    setUsers(users.filter((u) => u.id !== userId));
  };
  
  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData = {
      name: formData.get("name") as string,
      nik: formData.get("nik") as string,
      password: formData.get("password") as string,
      batangan: formData.get("batangan") as string,
      location: formData.get("location") as string,
    };

    if (editingUser) {
      // Update existing user
      setUsers(users.map((u) => u.id === editingUser.id ? { ...u, ...userData } : u));
    } else {
      // Add new user
      const newUser = { id: Date.now(), ...userData };
      setUsers([...users, newUser]);
    }
    
    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Pengguna</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus data pengguna (sopir/operator).
            </CardDescription>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Sopir/Operator</TableHead>
                <TableHead>NIK</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Batangan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.nik}</TableCell>
                  <TableCell>{"*".repeat(user.password.length)}</TableCell>
                  <TableCell>{user.batangan}</TableCell>
                  <TableCell>{user.location}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
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
                            Tindakan ini tidak dapat diurungkan. Ini akan menghapus data pengguna secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">
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
              <DialogTitle>{editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Ubah detail pengguna dan klik simpan.' : 'Isi detail pengguna baru dan klik tambah.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nama
                </Label>
                <Input id="name" name="name" defaultValue={editingUser?.name} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nik" className="text-right">
                  NIK
                </Label>
                <Input id="nik" name="nik" defaultValue={editingUser?.nik} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input id="password" name="password" type="password" defaultValue={editingUser?.password} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="batangan" className="text-right">
                  Batangan
                </Label>
                <Input id="batangan" name="batangan" defaultValue={editingUser?.batangan} className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Lokasi
                </Label>
                <Input id="location" name="location" defaultValue={editingUser?.location} className="col-span-3" required />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">Batal</Button>
              </DialogClose>
              <Button type="submit">{editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
