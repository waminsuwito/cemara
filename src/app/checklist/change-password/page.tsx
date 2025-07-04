
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";

const formSchema = z.object({
  oldPassword: z.string().min(1, "Password lama harus diisi."),
  newPassword: z.string().min(4, "Password baru minimal 4 karakter."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi tidak cocok.",
  path: ["confirmPassword"],
});

type ChangePasswordFormData = z.infer<typeof formSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user: operator, logout } = useOperatorAuth();
  const { users, updateUser } = useAppData();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormData) => {
    setIsLoading(true);
    if (!operator) {
      toast({ variant: "destructive", title: "Error", description: "Sesi tidak valid, silakan login ulang." });
      setIsLoading(false);
      return;
    }

    const currentUserData = users.find(u => u.id === operator.id);
    if (!currentUserData) {
      toast({ variant: "destructive", title: "Error", description: "Data pengguna tidak ditemukan." });
      setIsLoading(false);
      return;
    }

    if (currentUserData.password !== values.oldPassword) {
      form.setError("oldPassword", { type: "manual", message: "Password lama salah." });
      setIsLoading(false);
      return;
    }
    
    if (values.oldPassword === values.newPassword) {
      form.setError("newPassword", { type: "manual", message: "Password baru tidak boleh sama dengan password lama." });
      setIsLoading(false);
      return;
    }

    try {
      await updateUser({ ...currentUserData, password: values.newPassword });
      toast({
        title: "Sukses",
        description: "Password Anda telah berhasil diubah. Silakan login kembali.",
      });
      // Logout for security reasons after password change
      logout();
      router.push('/');
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Gagal memperbarui password." });
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ganti Password</CardTitle>
        <CardDescription>Ubah password Anda secara berkala untuk menjaga keamanan akun.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Lama</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password Baru</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
