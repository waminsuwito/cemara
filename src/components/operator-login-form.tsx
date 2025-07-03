
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username (NIK/Nama) harus diisi." }),
  password: z.string().min(1, { message: "Password harus diisi." }),
});

export function OperatorLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useOperatorAuth();
  const { users, vehicles } = useAppData();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const inputUsername = values.username.toLowerCase().trim();
    const inputPassword = values.password.trim();

    const foundUser = users.find((user) => {
      if (user.role !== 'OPERATOR') return false;
      const userNik = user.nik?.toString().toLowerCase().trim();
      const userName = user.name?.toLowerCase().trim();
      return userNik === inputUsername || userName === inputUsername;
    });

    if (!foundUser) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Pengguna dengan NIK atau Nama tersebut tidak ditemukan.",
      });
      setIsLoading(false);
      return;
    }

    if (foundUser.password !== inputPassword) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Password yang Anda masukkan salah.",
      });
      setIsLoading(false);
      return;
    }

    const batanganList = foundUser.batangan?.split(',').map(b => b.trim()).filter(Boolean) || [];

    if (batanganList.length === 0) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: `Operator "${foundUser.name}" tidak memiliki kendaraan (batangan) yang ditugaskan.`,
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Login Berhasil",
      description: `Selamat datang, ${foundUser.name}.`,
    });

    if (batanganList.length === 1) {
      const singleBatangan = batanganList[0];
      const cleanBatangan = singleBatangan.replace(/[-\s]/g, '').toLowerCase();
      const vehicle = vehicles.find(v => 
        v.licensePlate?.replace(/[-\s]/g, '').toLowerCase() === cleanBatangan
      );

      if (vehicle) {
        login(foundUser, vehicle.hullNumber);
        router.push("/checklist");
      } else {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: `Kendaraan dengan Nomor Polisi "${singleBatangan}" yang ditugaskan untuk Anda tidak dapat ditemukan.`,
          duration: 9000
        });
        setIsLoading(false);
      }
    } else {
      // More than one vehicle, let the user choose
      login(foundUser, null);
      router.push("/select-vehicle");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username (NIK/Nama)</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: 1001 atau Umar Santoso" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login & Mulai Checklist
        </Button>
      </form>
    </Form>
  );
}
