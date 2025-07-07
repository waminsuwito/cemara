
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/context/admin-auth-context";
import { useAppData } from "@/context/app-data-context";

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
import { useState } from "react";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(1, { message: "Username harus diisi." }),
  password: z.string().min(1, { message: "Password harus diisi." }),
});

export function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAdminAuth();
  const { users } = useAppData();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "superadmin",
      password: "1",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    const inputUsername = values.username.toLowerCase().trim();
    const inputPassword = values.password.trim();

    const foundUser = users.find(
      (u) =>
        (u.role === 'SUPER_ADMIN' || u.role === 'LOCATION_ADMIN' || u.role === 'KEPALA_BP') &&
        u.username?.toLowerCase().trim() === inputUsername &&
        u.password === inputPassword
    );

    if (foundUser && foundUser.username) {
      login({
        username: foundUser.username,
        role: foundUser.role,
        location: foundUser.location,
      });
      toast({
        title: "Login Berhasil",
        description: `Selamat datang, ${foundUser.name}.`,
      });
      router.push("/admin/dashboard");
    } else {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Username atau password salah. Pastikan data pengguna ada di database Firebase yang baru.",
      });
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="superadmin" {...field} />
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
          Login
        </Button>
      </form>
    </Form>
  );
}
