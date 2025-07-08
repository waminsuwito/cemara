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
import { useAdminAuth } from "@/context/admin-auth-context";
import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";
import { User } from "@/lib/data";

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Username, NIK, atau Nama harus diisi." }),
  password: z.string().min(1, { message: "Password harus diisi." }),
});

export function UnifiedLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { login: adminLogin } = useAdminAuth();
  const { login: operatorLogin } = useOperatorAuth();
  const { users, vehicles } = useAppData();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const inputIdentifier = values.identifier.toLowerCase().trim();
    const inputPassword = values.password.trim();

    const foundUser = users.find((user) => {
        const hasUsername = user.username && user.username.toLowerCase().trim() === inputIdentifier;
        const hasNik = user.nik && user.nik.toLowerCase().trim() === inputIdentifier;
        const hasName = user.name && user.name.toLowerCase().trim() === inputIdentifier;
        return hasUsername || hasNik || hasName;
    });

    if (foundUser && foundUser.password === inputPassword) {
        handleSuccessfulLogin(foundUser);
    } else {
      toast({
        variant: "destructive",
        title: "Login Gagal",
        description: "Kredensial yang Anda masukkan salah.",
      });
      setIsLoading(false);
    }
  }

  const handleSuccessfulLogin = (user: User) => {
    toast({
      title: "Login Berhasil",
      description: `Selamat datang, ${user.name}.`,
    });

    switch (user.role) {
      case 'SUPER_ADMIN':
      case 'LOCATION_ADMIN':
        if (user.username) {
            adminLogin({ username: user.username, role: user.role, location: user.location });
            router.push("/admin/dashboard");
        }
        break;
      
      case 'MEKANIK':
         if (user.username) {
            adminLogin({ username: user.username, role: user.role, location: user.location });
            router.push("/mechanic/dashboard");
        }
        break;

      case 'LOGISTIK':
         if (user.username) {
            adminLogin({ username: user.username, role: user.role, location: user.location });
            router.push("/logistik/dashboard");
        }
        break;

      case 'OPERATOR':
      case 'KEPALA_BP':
        const batanganList = user.batangan?.split(',').map(b => b.trim()).filter(Boolean) || [];
        if (batanganList.length === 0) {
            toast({
                variant: "destructive",
                title: "Login Gagal",
                description: `Pengguna "${user.name}" tidak memiliki kendaraan (batangan) yang ditugaskan.`,
            });
            setIsLoading(false);
            return;
        }

        if (batanganList.length === 1 && user.role === 'OPERATOR') {
          const singleBatangan = batanganList[0];
          const cleanBatangan = singleBatangan.replace(/[-\s]/g, '').toLowerCase();
          const vehicle = vehicles.find(v => v.licensePlate?.replace(/[-\s]/g, '').toLowerCase() === cleanBatangan);

          if (vehicle) {
            operatorLogin(user, vehicle.hullNumber);
            router.push("/checklist");
          } else {
            toast({
              variant: "destructive",
              title: "Login Gagal",
              description: `Kendaraan "${singleBatangan}" yang ditugaskan tidak ditemukan.`,
              duration: 7000
            });
            setIsLoading(false);
          }
        } else {
          // Kepala BP or Operator with multiple vehicles goes to selection
          operatorLogin(user, null);
          router.push("/checklist/select-vehicle");
        }
        break;

      default:
        toast({
          variant: "destructive",
          title: "Login Gagal",
          description: "Role pengguna tidak diketahui. Hubungi admin.",
        });
        setIsLoading(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username / NIK / Nama</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan kredensial Anda" {...field} />
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
