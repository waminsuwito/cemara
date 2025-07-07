
"use client";

import { useOperatorAuth } from "@/context/operator-auth-context";
import { useAppData } from "@/context/app-data-context";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldX } from "lucide-react";
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

export default function MyPenaltyPage() {
    const { user: operator } = useOperatorAuth();
    const { penalties } = useAppData();

    const myPenalties = useMemo(() => {
        if (!operator) return [];
        return penalties.filter(p => p.userId === operator.id)
                        .sort((a,b) => b.timestamp - a.timestamp);
    }, [operator, penalties]);

    const totalPoints = useMemo(() => {
        return myPenalties.reduce((sum, p) => sum + p.points, 0);
    }, [myPenalties]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Riwayat Penalti Saya</CardTitle>
                <CardDescription>
                    Berikut adalah riwayat dan total poin Penalty Anda terkait kedisiplinan checklist.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-center p-6 bg-muted/50 rounded-lg">
                    <ShieldX className="w-12 h-12 text-destructive mr-6" />
                    <div>
                        <p className="text-lg text-muted-foreground">Total Penalty Anda</p>
                        <p className="text-5xl font-bold text-destructive">{totalPoints}</p>
                    </div>
                </div>
                
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Penalty</TableHead>
                                <TableHead>Kendaraan</TableHead>
                                <TableHead>Alasan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {myPenalties.length > 0 ? (
                                myPenalties.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{format(new Date(p.timestamp), 'dd MMM yyyy, HH:mm', { locale: localeID })}</TableCell>
                                        <TableCell className="font-bold">{p.points}</TableCell>
                                        <TableCell>{p.vehicleHullNumber}</TableCell>
                                        <TableCell>{p.reason}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        Selamat! Anda tidak memiliki penalty.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                <p className="text-xs text-muted-foreground">Hubungi admin jika ada pertanyaan mengenai data penalty Anda.</p>
            </CardFooter>
        </Card>
    );
}
