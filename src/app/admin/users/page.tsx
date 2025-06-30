
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
import type { UserRole } from "@/context/admin-auth-context";

type User = {
  id: number;
  name: string;
  nik?: string;
  username?: string;
  password?: string;
  batangan?: string;
  location?: string;
  role: UserRole;
};

const initialUsers: User[] = [
  // Admins
  { id: 101, name: "Super Admin", username: "superadmin", password: "1", role: "SUPER_ADMIN" },
  { id: 102, name: "Admin Pekanbaru", username: "admin_pku", password: "1", role: "LOCATION_ADMIN", location: "BP Pekanbaru" },
  { id: 103, name: "Admin Baung", username: "admin_baung", password: "1", role: "LOCATION_ADMIN", location: "BP Baung" },
  { id: 104, name: "Admin Dumai", username: "admin_dumai", password: "1", role: "LOCATION_ADMIN", location: "BP Dumai" },
  { id: 105, name: "Admin IKN", username: "admin_ikn", password: "1", role: "LOCATION_ADMIN", location: "BP IKN" },
  
  // Operators
  { id: 1, name: "Umar Santoso", nik: "1001", password: "password", batangan: "EX-01", location: "BP Pekanbaru", role: "OPERATOR" },
  { id: 2, name: "Aep Saefudin", nik: "1002", password: "password", batangan: "DT-01", location: "BP Baung", role: "OPERATOR" },
  { id: 3, name: "Amirul", nik: "1003", password: "password", batangan: "CP-01", location: "BP Dumai", role: "OPERATOR" },
  { id: 4, name: "Solihin", nik: "1004", password: "password", batangan: "TM-01", location: "BP IKN", role: "OPERATOR" },
  { id: 5, name: "Siswanto", nik: "1005", password: "password", batangan: "FK-01", location: "BP Pekanbaru", role: "OPERATOR" },
  { id: 6, name: "Budi", nik: "1006", password: "password", batangan: "GS-01", location: "BP Baung", role: "OPERATOR" },
  { id: 7, name: "Charlie", nik: "1007", password: "password", batangan: "BP-01", location: "BP Dumai", role: "OPERATOR" },
  { id: 8, name: "Dedi", nik: "1008", password: "password", batangan: "KI-01", location: "BP IKN", role: "OPERATOR" },
  { id: 9, name: "Eko", nik: "1009", password: "password", batangan: "KT-01", location: "BP Pekanbaru", role: "OPERATOR" },
  { id: 10, name: "Kiki", nik: "1010", password: "password", batangan: "LD-01", location: "BP Dumai", role: "OPERATOR" },
];

const locations = ["BP Pekanbaru", "BP Baung", "BP Dumai", "BP IKN"];
const roles: UserRole[] = ["OPERATOR", "LOCATION_ADMIN", "SUPER_ADMIN"];

export default function UserManagementPage() {
  const { user } = useAdminAuth();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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

  const handleDelete = (userId: number) => {
    setUsers(users.filter((u) => u.id !== userId));
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const role = formData.get("role") as UserRole;

    const baseData: Partial<User> = {
      name: formData.get("name") as string,
      password: formData.get("password") as string,
      role,
    };

    let userData: Omit<User, 'id'>;

    if (role === 'OPERATOR') {
      userData = {
        ...baseData,
        role: 'OPERATOR',
        nik: formData.get("nik") as string,
        batangan: formData.get("batangan") as string,
        location: formData.get("location") as string,
      };
    } else { // LOCATION_ADMIN or SUPER_ADMIN
      userData = {
        ...baseData,
        role: role,
        username: formData.get("username") as string,
        location: role === 'LOCATION_ADMIN' ? formData.get("location") as string : undefined,
      };
    }


    if (editingUser) {
      setUsers(
        users.map((u) => (u.id === editingUser.id ? { id: u.id, ...(userData as User) } : u))
      );
    } else {
      const newUser = { id: Date.now(), ...(userData as User) };
      setUsers([...users, newUser]);
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
                {locations.map((location) => (
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
                          disabled={user.role === 'SUPER_ADMIN' && user.id === 101}
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
                    <Input id="password" name="password" type="password" defaultValue={editingUser?.password} className="col-span-3" required />
                </div>

                {role !== 'SUPER_ADMIN' && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="location" className="text-right">Lokasi</Label>
                         <Select name="location" defaultValue={editingUser?.location || locations[0]} required>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Pilih Lokasi" />
                            </SelectTrigger>
                            <SelectContent>
                                {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
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
