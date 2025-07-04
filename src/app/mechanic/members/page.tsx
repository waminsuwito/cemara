
"use client";

import React, { useMemo } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MechanicMembersPage() {
  const { users } = useAppData();

  const mechanics = useMemo(() => {
    return users
      .filter((user) => user.role === "MEKANIK")
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anggota Tim Mekanik</CardTitle>
        <CardDescription>
          Daftar semua mekanik yang terdaftar dalam sistem.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">Nama</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Lokasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mechanics.length > 0 ? (
                mechanics.map((mechanic) => (
                  <TableRow key={mechanic.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {mechanic.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{mechanic.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{mechanic.username}</TableCell>
                    <TableCell>{mechanic.location || "Semua Lokasi"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Tidak ada mekanik yang terdaftar.
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
