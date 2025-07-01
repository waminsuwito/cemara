
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// This is placeholder data. In a future step, this will come from the AppDataContext.
const complaints:any[] = [
  // {
  //   id: '1',
  //   date: '2024-07-28 10:00',
  //   operator: 'Umar Santoso',
  //   vehicle: 'DT-01',
  //   location: 'Lokasi BP A',
  //   complaint: 'Rem terasa kurang pakem saat turunan, mohon diperiksa segera.',
  //   status: 'OPEN'
  // },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "OPEN":
      return <Badge variant="destructive">Baru</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Ditangani</Badge>;
    case "RESOLVED":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Selesai</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function ComplaintsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Komplain dari Sopir</CardTitle>
        <CardDescription>
          Daftar komplain yang dikirimkan oleh sopir/operator terkait kondisi alat.
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
                <TableHead className="w-[40%]">Isi Komplain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.length > 0 ? (
                complaints.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.operator}</TableCell>
                    <TableCell>{item.vehicle}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.complaint}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">
                        Tandai Selesai
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Belum ada komplain yang dikirimkan.
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
