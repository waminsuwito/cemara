
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

    // Step 1: Find the user by NIK or Name.
    const foundUser = users.find((user) => {
      if (user.role !== 'OPERATOR') return false;
      
      const userNik = user.nik?.toString().toLowerCase().trim();
      const userName = user.name?.toLowerCase().trim();
      
      return userNik === inputUsername || userName === inputUsername;
    });

    // Step 2: Handle "User not found" case.
    if (!foundUser) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Pengguna dengan NIK atau Nama tersebut tidak ditemukan.",
      });
      setIsLoading(false);
      return;
    }

    // Step 3: Handle "Password incorrect" case.
    if (foundUser.password !== inputPassword) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Password yang Anda masukkan salah.",
      });
      setIsLoading(false);
      return;
    }

    // Step 4: Handle "No vehicle assigned" case.
    if (!foundUser.batangan) {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: `Operator "${foundUser.name}" tidak memiliki kendaraan (batangan) yang ditugaskan.`,
      });
      setIsLoading(false);
      return;
    }

    // Step 5: Match the vehicle with robust logic (case and space insensitive)
    const cleanBatangan = foundUser.batangan.replace(/\s/g, '').toLowerCase();
    const vehicle = vehicles.find(v => 
      v.hullNumber?.replace(/\s/g, '').toLowerCase() === cleanBatangan
    );
    
    if (vehicle) {
        login(foundUser, vehicle.hullNumber);
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${foundUser.name}.`,
        });
        router.push("/checklist");
    } else {
         toast({
            variant: "destructive",
            title: "Login Gagal",
            description: `Kendaraan dengan Nomor Lambung "${foundUser.batangan}" yang ditugaskan untuk Anda tidak dapat ditemukan di daftar alat.`,
            duration: 9000
        });
        setIsLoading(false);
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
