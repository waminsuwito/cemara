
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

// This is placeholder data. In a future step, this will come from the AppDataContext.
const suggestions:any[] = [
  // {
  //   id: '1',
  //   date: '2024-07-27 15:30',
  //   operator: 'Budi Hartono',
  //   vehicle: 'EX-05',
  //   location: 'Lokasi BP C',
  //   suggestion: 'Mohon disediakan APAR (alat pemadam api ringan) yang baru di setiap kabin alat berat untuk meningkatkan keselamatan.'
  // },
];

export default function SuggestionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usulan dan Saran dari Sopir</CardTitle>
        <CardDescription>
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
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.operator}</TableCell>
                    <TableCell>{item.vehicle}</TableCell>
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
