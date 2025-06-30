
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth, type UserRole } from "@/context/admin-auth-context";

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

// This would typically come from a database or secure source
const adminUsers = [
  { username: "superadmin", password: "1", role: "SUPER_ADMIN" as UserRole },
  { username: "admin_pku", password: "1", role: "LOCATION_ADMIN" as UserRole, location: "BP Pekanbaru" },
  { username: "admin_baung", password: "1", role: "LOCATION_ADMIN" as UserRole, location: "BP Baung" },
  { username: "admin_dumai", password: "1", role: "LOCATION_ADMIN" as UserRole, location: "BP Dumai" },
  { username: "admin_ikn", password: "1", role: "LOCATION_ADMIN" as UserRole, location: "BP IKN" },
];

export function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login } = useAdminAuth();
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
    setTimeout(() => {
      const foundUser = adminUsers.find(
        (u) => u.username === values.username && u.password === values.password
      );

      if (foundUser) {
        login({
          username: foundUser.username,
          role: foundUser.role,
          location: foundUser.location,
        });
        toast({
          title: "Login Berhasil",
          description: `Selamat datang, ${foundUser.username}.`,
        });
        router.push("/admin/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "Username atau password salah.",
        });
      }
      setIsLoading(false);
    }, 1000);
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
