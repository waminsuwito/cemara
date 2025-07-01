
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Pencil, Trash2, ShieldAlert } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";
import { roles, type User, type UserRole } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function UserManagementPage() {
  const { user: currentUser } = useAdminAuth();
  const { users, addUser, updateUser, deleteUser, locationNames } = useAppData();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  if (!isSuperAdmin) {
    return (
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
            <ShieldAlert className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">Akses Ditolak</h3>
            <p className="text-sm text-muted-foreground">
                Hanya Super Admin yang dapat mengakses halaman ini.
            </p>
        </div>
      </div>
    );
  }

  const handleAddNew = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: string) => {
    deleteUser(userId);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = formData.get("role") as UserRole;
    const nik = formData.get("nik") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    // Validation for OPERATOR NIK uniqueness
    if (role === "OPERATOR" && nik) {
      const isNikTaken = users.some(
        (u) =>
          u.role === "OPERATOR" &&
          u.nik?.toLowerCase() === nik.toLowerCase() &&
          u.id !== editingUser?.id
      );
      if (isNikTaken) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: `Operator dengan NIK ${nik} sudah terdaftar.`,
        });
        return;
      }
    }

    // Validation for ADMIN USERNAME uniqueness
    if ((role === "SUPER_ADMIN" || role === "LOCATION_ADMIN") && username) {
      const isAdminUsernameTaken = users.some(
        (u) =>
          (u.role === "SUPER_ADMIN" || u.role === "LOCATION_ADMIN") &&
          u.username?.toLowerCase() === username.toLowerCase() &&
          u.id !== editingUser?.id
      );
      if (isAdminUsernameTaken) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: `Admin dengan username '${username}' sudah terdaftar.`,
        });
        return;
      }
    }

    if (editingUser) {
        // Build the update object from the editing user
        const updatedUser: User = { ...editingUser };
        
        // Update common fields
        updatedUser.name = name;
        updatedUser.role = role;
        
        // Update role-specific fields
        if (role === 'OPERATOR') {
            updatedUser.nik = nik;
            updatedUser.batangan = formData.get("batangan") as string;
            updatedUser.location = formData.get("location") as string;
            // Clear admin fields
            updatedUser.username = undefined;
        } else { // SUPER_ADMIN or LOCATION_ADMIN
            updatedUser.username = username;
            updatedUser.location = role === 'LOCATION_ADMIN' ? formData.get("location") as string : undefined;
            // Clear operator fields
            updatedUser.nik = undefined;
            updatedUser.batangan = undefined;
        }
        
        // **CRITICAL FIX**: Only update the password if a new one was entered.
        // If the password field is empty, the existing password remains unchanged.
        if (password) {
            updatedUser.password = password;
        }
        
        updateUser(updatedUser);
    } else {
        // Creating a new user
        if (!password) {
            toast({
                variant: "destructive",
                title: "Gagal Menyimpan",
                description: "Password wajib diisi untuk pengguna baru.",
            });
            return;
        }
        
        let newUser: Omit<User, 'id'> = {
            name,
            password,
            role,
        };

        if (role === 'OPERATOR') {
            newUser.nik = nik;
            newUser.batangan = formData.get("batangan") as string;
            newUser.location = formData.get("location") as string;
        } else {
            newUser.username = username;
            if (role === 'LOCATION_ADMIN') {
                newUser.location = formData.get("location") as string;
            }
        }
        addUser(newUser);
    }

    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const filteredUsers =
    locationFilter === "all"
      ? users
      : users.filter((u) => u.location === locationFilter);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Pengguna</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus data pengguna (Admin & Operator).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
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
              Tambah Pengguna
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Username/NIK</TableHead>
                <TableHead>Batangan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.username || user.nik}</TableCell>
                  <TableCell>{user.batangan || 'N/A'}</TableCell>
                  <TableCell>{user.location || 'Semua'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(user)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          disabled={user.username === 'superadmin'}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Apakah Anda yakin?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tindakan ini tidak dapat diurungkan. Ini akan
                            menghapus data pengguna secara permanen.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(user.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
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
      <UserFormDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen}
        editingUser={editingUser}
        onSave={handleSave}
      />
    </>
  );
}

function UserFormDialog({ isOpen, setIsOpen, editingUser, onSave }: {
    isOpen: boolean,
    setIsOpen: (open: boolean) => void,
    editingUser: User | null,
    onSave: (e: React.FormEvent<HTMLFormElement>) => void
}) {
    const [role, setRole] = useState<UserRole>(editingUser?.role || 'OPERATOR');
    const { locationNames } = useAppData();

    React.useEffect(() => {
        if (isOpen) {
            setRole(editingUser?.role || 'OPERATOR');
        }
    }, [isOpen, editingUser]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={onSave}>
                <DialogHeader>
                <DialogTitle>
                    {editingUser ? "Edit Pengguna" : "Tambah Pengguna Baru"}
                </DialogTitle>
                <DialogDescription>
                    {editingUser
                    ? "Ubah detail pengguna dan klik simpan."
                    : "Isi detail pengguna baru dan klik tambah."}
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <Select name="role" value={role} onValueChange={(v) => setRole(v as UserRole)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Pilih Role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nama</Label>
                    <Input id="name" name="name" defaultValue={editingUser?.name} className="col-span-3" required />
                </div>
                
                {role === 'OPERATOR' ? (
                    <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nik" className="text-right">NIK</Label>
                            <Input id="nik" name="nik" defaultValue={editingUser?.nik} className="col-span-3" required />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batangan" className="text-right">Batangan</Label>
                            <Input id="batangan" name="batangan" defaultValue={editingUser?.batangan} className="col-span-3" required />
                        </div>
                    </>
                ) : (
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="username" className="text-right">Username</Label>
                        <Input id="username" name="username" defaultValue={editingUser?.username} className="col-span-3" required />
                    </div>
                )}
                
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">Password</Label>
                    <Input id="password" name="password" type="password" className="col-span-3" required={!editingUser} placeholder={editingUser ? "Isi untuk mengubah" : ""} />
                </div>

                {role !== 'SUPER_ADMIN' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Lokasi</Label>
                         <Select name="location" defaultValue={editingUser?.location || locationNames[0]} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Pilih Lokasi" />
                            </SelectTrigger>
                            <SelectContent>
                                {locationNames.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                </div>
                <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="submit">
                    {editingUser ? "Simpan Perubahan" : "Tambah Pengguna"}
                </Button>
                </DialogFooter>
            </form>
            </DialogContent>
        </Dialog>
    );
}
