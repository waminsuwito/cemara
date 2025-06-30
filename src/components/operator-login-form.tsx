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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  nik: z.string().min(1, { message: "NIK harus diisi." }),
  operatorName: z.string({ required_error: "Nama operator harus dipilih." }),
  vehicleNumber: z.string().min(1, { message: "Nomor kendaraan harus diisi." }),
  vehicleType: z.string().min(1, { message: "Jenis kendaraan harus diisi." }),
  location: z.string().min(1, { message: "Lokasi BP harus diisi." }),
});

const operatorNames = [
  "Umar Santoso",
  "Aep Saefudin",
  "Amirul",
  "Solihin",
  "Solehan",
  "Siswanto",
];

export function OperatorLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nik: "",
      vehicleNumber: "",
      vehicleType: "",
      location: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // Simulate API call and redirect
    setTimeout(() => {
      toast({
        title: "Login Berhasil",
        description: `Selamat datang, ${values.operatorName}.`,
      });
      router.push("/checklist");
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nik"
          render={({ field }) => (
            <FormItem>
              <FormLabel>NIK</FormLabel>
              <FormControl>
                <Input placeholder="Masukkan NIK Anda" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="operatorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Operator/Driver</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Nama Anda" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {operatorNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicleNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nomor Kendaraan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: B 1234 XYZ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kendaraan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Dump Truck, Excavator" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lokasi BP</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Site A, Plant B" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login & Mulai Checklist
        </Button>
      </form>
    </Form>
  );
}
