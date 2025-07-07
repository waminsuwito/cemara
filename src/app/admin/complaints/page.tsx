
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/context/app-data-context";
import { format } from "date-fns";
import { id as localeID } from 'date-fns/locale';
import { MoreHorizontal, Printer } from "lucide-react";
import { type Complaint } from "@/lib/data";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "OPEN":
      return <Badge variant="destructive">Baru</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">Ditangani</Badge>;
    case "RESOLVED":
      return <Badge variant="secondary" className="bg-green-400 text-green-900">Selesai</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export default function ComplaintsPage() {
  const { complaints, updateComplaintStatus } = useAppData();

  const handleStatusChange = (id: string, status: Complaint['status']) => {
    updateComplaintStatus(id, status);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Komplain dari Sopir</CardTitle>
          <CardDescription>
            Daftar komplain yang dikirimkan oleh sopir/operator terkait kondisi alat.
          </CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/complaints/print">
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
                <TableHead className="w-[40%]">Isi Komplain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.length > 0 ? (
                complaints.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                    <TableCell>{item.operatorName}</TableCell>
                    <TableCell>{item.vehicleId}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.complaint}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Buka menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'IN_PROGRESS')}>
                            Tandai "Ditangani"
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'RESOLVED')}>
                            Tandai "Selesai"
                          </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => handleStatusChange(item.id, 'OPEN')}>
                            Set Kembali ke "Baru"
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
