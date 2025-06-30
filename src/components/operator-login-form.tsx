
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
  username: z.string().trim().min(1, { message: "Username (NIK/Nama) harus diisi." }),
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
    
    setTimeout(() => {
      const foundUser = users.find((user) => {
        if (user.role !== 'OPERATOR' || user.password !== values.password) {
            return false;
        }
        const inputUsername = values.username.trim().toLowerCase();
        const userNik = user.nik?.toString().trim().toLowerCase();
        const userName = user.name?.trim().toLowerCase();
        
        return userNik === inputUsername || userName === inputUsername;
      });

      if (foundUser) {
        if (foundUser.batangan) {
            const vehicle = vehicles.find(v => 
                v.licensePlate?.trim().toLowerCase() === foundUser.batangan?.trim().toLowerCase()
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
                    description: `Kendaraan dengan nomor polisi "${foundUser.batangan}" tidak ditemukan. Pastikan data "Batangan" di profil Operator cocok dengan "Nomor Polisi" di data Alat.`,
                });
            }
        } else {
             toast({
                variant: "destructive",
                title: "Login Gagal",
                description: `Operator "${foundUser.name}" tidak memiliki kendaraan (batangan) yang ditugaskan.`,
            });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "NIK/Nama atau password salah.",
        });
      }
      setIsLoading(false);
    }, 1000);
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
