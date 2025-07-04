
"use client";

import React, { useState, useMemo } from "react";
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
import { User, UserRole } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { UserFormDialog } from "@/components/user-form-dialog";

export default function UserManagementPage() {
  const { user: currentUser } = useAdminAuth();
  const { users, addUser, updateUser, deleteUser, locationNames } = useAppData();
  const { toast } = useToast();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isLocationAdmin = currentUser?.role === 'LOCATION_ADMIN';
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [locationFilter, setLocationFilter] = useState(
    isSuperAdmin ? "all" : currentUser?.location || "all"
  );
  
  if (!isSuperAdmin && !isLocationAdmin) {
    return (
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
            <ShieldAlert className="h-16 w-16 text-muted-foreground" />
            <h3 className="text-2xl font-bold tracking-tight">Akses Ditolak</h3>
            <p className="text-sm text-muted-foreground">
                Anda tidak memiliki izin untuk mengakses halaman ini.
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
    if (currentUser?.username && users.find(u => u.id === userId)?.username === currentUser.username) {
        toast({
            variant: "destructive",
            title: "Aksi Ditolak",
            description: "Anda tidak dapat menghapus akun Anda sendiri.",
        });
        return;
    }
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
    const location = formData.get("location") as string;
    const batangan = formData.get("batangan") as string;

    // --- Start Validation ---
    if ((role === 'OPERATOR' || role === 'MEKANIK') && nik) {
      const isNikTaken = users.some(u => 
        (u.role === role) && u.nik?.toLowerCase().trim() === nik.toLowerCase().trim() && u.id !== editingUser?.id
      );
      if (isNikTaken) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: `${role} dengan NIK ${nik} sudah terdaftar.`,
        });
        return;
      }
    }

    if (role === "OPERATOR" && batangan) {
      const newBatanganList = batangan.split(',').map(b => b.trim().toLowerCase()).filter(Boolean);
      for (const b of newBatanganList) {
        const isBatanganInOtherLocation = users.some(u => 
          u.id !== editingUser?.id &&
          u.role === 'OPERATOR' &&
          u.location !== location &&
          u.batangan?.split(',').map(bt => bt.trim().toLowerCase()).includes(b)
        );
        if (isBatanganInOtherLocation) {
          toast({
            variant: "destructive",
            title: "Gagal Menyimpan",
            description: `Nomor Polisi "${b.toUpperCase()}" sudah ditugaskan untuk operator di lokasi lain.`,
            duration: 7000,
          });
          return;
        }
      }
    }

    if ((role === "SUPER_ADMIN" || role === "LOCATION_ADMIN" || role === "MEKANIK") && username) {
      const isAdminUsernameTaken = users.some(
        (u) =>
          (u.role === "SUPER_ADMIN" || u.role === "LOCATION_ADMIN" || u.role === "MEKANIK") &&
          u.username?.toLowerCase().trim() === username.toLowerCase().trim() &&
          u.id !== editingUser?.id
      );
      if (isAdminUsernameTaken) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: `Pengguna dengan username '${username}' sudah terdaftar.`,
        });
        return;
      }
    }
    // --- End Validation ---

    if (editingUser) {
        const userToUpdate: User = { ...editingUser, name, role };
        
        if (password.trim() !== '') {
            userToUpdate.password = password;
        }
        
        if (role === 'OPERATOR') {
            userToUpdate.nik = nik;
            userToUpdate.batangan = batangan;
            userToUpdate.location = location;
            userToUpdate.username = undefined; // Clean up admin-specific fields
        } else if (role === 'MEKANIK') {
            userToUpdate.username = username;
            userToUpdate.nik = nik;
            userToUpdate.location = location;
            userToUpdate.batangan = undefined;
        } else { // SUPER_ADMIN, LOCATION_ADMIN
            userToUpdate.username = username;
            if (role === 'LOCATION_ADMIN') {
                userToUpdate.location = location;
            } else { // SUPER_ADMIN
                userToUpdate.location = undefined;
            }
            userToUpdate.nik = undefined; // Clean up other roles fields
            userToUpdate.batangan = undefined;
        }
        
        updateUser(userToUpdate);

    } else {
        if (!password.trim()) {
            toast({
                variant: "destructive",
                title: "Gagal Menyimpan",
                description: "Password wajib diisi untuk pengguna baru.",
            });
            return;
        }
        
        let newUser: Omit<User, 'id'> = { name, password, role };

        if (role === 'OPERATOR') {
            newUser = { ...newUser, nik, batangan, location };
        } else if (role === 'MEKANIK') {
             newUser = { ...newUser, username, nik, location };
        } else { // SUPER_ADMIN, LOCATION_ADMIN
             newUser = { ...newUser, username };
            if (role === 'LOCATION_ADMIN') {
                newUser.location = location;
            }
        }
        addUser(newUser);
    }

    setIsDialogOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (isSuperAdmin) {
        if (locationFilter === 'all') return true;
        // Also show users without a location (super admins)
        return user.location === locationFilter || !user.location;
      }
      if (isLocationAdmin) {
        // Location admin can only see users from their own location and not super admins.
        return user.location === currentUser.location && user.role !== 'SUPER_ADMIN';
      }
      return false;
    });
  }, [users, isSuperAdmin, isLocationAdmin, locationFilter, currentUser]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Pengguna</CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus data pengguna (Admin, Mekanik, & Operator).
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
                          disabled={user.role === 'SUPER_ADMIN'}
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
        currentUser={currentUser}
      />
    </>
  );
}
