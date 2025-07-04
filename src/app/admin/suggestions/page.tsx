
"use client";

import React from "react";
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

export default function SuggestionsPage() {
  const { suggestions } = useAppData();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Usulan dan Saran dari Sopir</CardTitle>
        <img
          src="https://i.ibb.co/V0NgdX7z/images.jpg"
          alt="Logo PT Farika Riau Perkasa"
          className="h-24 w-24 object-contain my-4 mx-auto"
        />
        <CardDescription className="text-center">
          Daftar usulan dan saran yang dikirimkan oleh sopir/operator untuk perbaikan.
        </CardDescription>
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
