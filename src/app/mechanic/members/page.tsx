
"use client";

import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppData } from "@/context/app-data-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { User, UserRole } from "@/lib/data";
import { UserFormDialog } from "@/components/user-form-dialog";
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


export default function MechanicMembersPage() {
  const { users, addUser, updateUser, deleteUser } = useAppData();
  const { user: currentUser } = useAdminAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const canManage = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'LOCATION_ADMIN';

  const mechanics = useMemo(() => {
    return users
      .filter((user) => user.role === "MEKANIK")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);
  
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
    const role: UserRole = "MEKANIK";
    const nik = formData.get("nik") as string;
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const location = formData.get("location") as string;

    // Validation
    if (nik) {
      const isNikTaken = users.some(u => 
        u.role === 'MEKANIK' && u.nik?.toLowerCase().trim() === nik.toLowerCase().trim() && u.id !== editingUser?.id
      );
      if (isNikTaken) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: `Mekanik dengan NIK ${nik} sudah terdaftar.`,
        });
        return;
      }
    }

    if (username) {
      const isUsernameTaken = users.some(
        (u) =>
          u.role === "MEKANIK" &&
          u.username?.toLowerCase().trim() === username.toLowerCase().trim() &&
          u.id !== editingUser?.id
      );
      if (isUsernameTaken) {
        toast({
          variant: "destructive",
          title: "Gagal Menyimpan",
          description: `Pengguna dengan username '${username}' sudah terdaftar.`,
        });
        return;
      }
    }

    if (editingUser) {
        const userToUpdate: User = { ...editingUser, name, role, username, nik, location, batangan: undefined };
        if (password.trim() !== '') {
            userToUpdate.password = password;
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
        const newUser: Omit<User, 'id'> = { name, password, role, username, nik, location };
        addUser(newUser);
    }

    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Anggota Tim Mekanik</CardTitle>
                <CardDescription>
                Daftar semua mekanik yang terdaftar dalam sistem.
                </CardDescription>
            </div>
            {canManage && (
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tambah Anggota
                </Button>
            )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Nama</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>NIK</TableHead>
                  <TableHead>Lokasi</TableHead>
                  {canManage && <TableHead className="text-right">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {mechanics.length > 0 ? (
                  mechanics.map((mechanic) => (
                    <TableRow key={mechanic.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>
                              {mechanic.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{mechanic.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{mechanic.username}</TableCell>
                      <TableCell>{mechanic.nik || "N/A"}</TableCell>
                      <TableCell>{mechanic.location || "Semua Lokasi"}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(mechanic)}
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
                                  menghapus data mekanik secara permanen.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(mechanic.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={canManage ? 6 : 5} className="h-24 text-center">
                      Tidak ada mekanik yang terdaftar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {canManage && (
        <UserFormDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          editingUser={editingUser}
          onSave={handleSave}
          currentUser={currentUser}
          forceRole="MEKANIK"
        />
      )}
    </>
  );
}
