
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AdminUser } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";
import { User, UserRole, roles } from "@/lib/data";

export function UserFormDialog({ isOpen, setIsOpen, editingUser, onSave, currentUser, forceRole }: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    editingUser: User | null;
    onSave: (e: React.FormEvent<HTMLFormElement>) => void;
    currentUser: AdminUser | null;
    forceRole?: UserRole;
}) {
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
    const [role, setRole] = useState<UserRole>(editingUser?.role || forceRole || 'OPERATOR');
    const { locationNames } = useAppData();

    React.useEffect(() => {
        if (isOpen) {
            setRole(editingUser?.role || forceRole || 'OPERATOR');
        }
    }, [isOpen, editingUser, forceRole]);

    const availableRoles = (isSuperAdmin ? roles : roles.filter(r => r !== 'SUPER_ADMIN')).filter(r => !forceRole || r === forceRole);
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={onSave}>
                <DialogHeader>
                <DialogTitle>
                    {editingUser ? `Edit ${forceRole || 'Pengguna'}` : `Tambah ${forceRole || 'Pengguna'} Baru`}
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
                        <Select name="role" value={role} onValueChange={(v) => setRole(v as UserRole)} disabled={!!forceRole}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Pilih Role" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nama</Label>
                        <Input id="name" name="name" defaultValue={editingUser?.name} className="col-span-3" required />
                    </div>
                    
                    {(role === 'OPERATOR' || role === 'KEPALA_BP') && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nik" className="text-right">NIK</Label>
                                <Input id="nik" name="nik" defaultValue={editingUser?.nik} className="col-span-3" required />
                            </div>
                             <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="batangan" className="text-right pt-2">Batangan</Label>
                                <Textarea 
                                  id="batangan" 
                                  name="batangan" 
                                  defaultValue={editingUser?.batangan} 
                                  className="col-span-3" 
                                  placeholder="Satu No. Polisi per baris, atau pisahkan dengan koma" 
                                  rows={3}
                                  required 
                                />
                            </div>
                        </>
                    )}
                    
                    {role === 'MEKANIK' && (
                        <>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">Username</Label>
                                <Input id="username" name="username" defaultValue={editingUser?.username} className="col-span-3" required />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="nik" className="text-right">NIK</Label>
                                <Input id="nik" name="nik" defaultValue={editingUser?.nik} className="col-span-3" required />
                            </div>
                        </>
                    )}
                    
                    {(role === 'SUPER_ADMIN' || role === 'LOCATION_ADMIN') && (
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="username" className="text-right">Username</Label>
                            <Input id="username" name="username" defaultValue={editingUser?.username} className="col-span-3" required disabled={editingUser?.username === 'superadmin'} />
                        </div>
                    )}
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input id="password" name="password" type="password" className="col-span-3" required={!editingUser} placeholder={editingUser ? "Isi untuk mengubah" : ""} />
                    </div>

                    {(role === 'LOCATION_ADMIN' || role === 'OPERATOR' || role === 'MEKANIK' || role === 'KEPALA_BP') && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="location" className="text-right">Lokasi</Label>
                             <Select name="location" defaultValue={editingUser?.location || (currentUser?.role === 'LOCATION_ADMIN' ? currentUser.location : '')} required={role === 'OPERATOR' || role === 'LOCATION_ADMIN' || role === 'KEPALA_BP' || role === 'MEKANIK'} disabled={!isSuperAdmin && currentUser?.role !== 'SUPER_ADMIN'}>
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
