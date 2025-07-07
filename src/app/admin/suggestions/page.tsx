
"use client";

import React from "react";
import Link from "next/link";
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
import { useAppData } from "@/context/app-data-context";
import { format } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function SuggestionsPage() {
  const { suggestions } = useAppData();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Usulan / Saran dari Sopir</CardTitle>
          <CardDescription>
            Daftar usulan dan saran yang dikirimkan oleh sopir/operator untuk perbaikan.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/suggestions/print">
            <Printer className="mr-2 h-4 w-4" />
            Cetak Laporan
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead className="w-[50%]">Isi Usulan/Saran</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suggestions.length > 0 ? (
                suggestions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                    <TableCell>{item.operatorName}</TableCell>
                    <TableCell>{item.vehicleId}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.suggestion}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Belum ada usulan atau saran yang dikirimkan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
