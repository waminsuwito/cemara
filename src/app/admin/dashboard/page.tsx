import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Wrench,
} from "lucide-react";

const recentReports = [
  {
    operator: "Umar Santoso",
    vehicle: "Excavator EX-01",
    location: "Site A",
    status: "Perlu Perhatian",
    date: "2024-05-20",
  },
  {
    operator: "Aep Saefudin",
    vehicle: "Dump Truck DT-05",
    location: "Site B",
    status: "Baik",
    date: "2024-05-20",
  },
  {
    operator: "Amirul",
    vehicle: "Bulldozer BD-02",
    location: "Site A",
    status: "Rusak",
    date: "2024-05-19",
  },
  {
    operator: "Solihin",
    vehicle: "Grader GD-03",
    location: "Site C",
    status: "Baik",
    date: "2024-05-19",
  },
  {
    operator: "Siswanto",
    vehicle: "Compactor CP-01",
    location: "Site B",
    status: "Baik",
    date: "2024-05-18",
  },
];

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Baik":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Baik</Badge>;
    case "Perlu Perhatian":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Perlu Perhatian</Badge>;
    case "Rusak":
      return <Badge variant="destructive">Rusak</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard Admin</h2>
        <div className="flex items-center space-x-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Lokasi BP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi BP</SelectItem>
              <SelectItem value="site-a">Site A</SelectItem>
              <SelectItem value="site-b">Site B</SelectItem>
              <SelectItem value="site-c">Site C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Alat" value="72" icon={Truck} description="Total semua alat berat" />
        <StatCard title="Alat Baik" value="65" icon={CheckCircle2} description="+5 dari kemarin" />
        <StatCard title="Alat Rusak" value="2" icon={Wrench} description="+1 dari kemarin" />
        <StatCard title="Perlu Perhatian" value="5" icon={AlertTriangle} description="-2 dari kemarin" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Terbaru</CardTitle>
          <CardDescription>
            Checklist yang baru saja dikirim oleh operator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operator</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentReports.map((report, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{report.operator}</TableCell>
                  <TableCell>{report.vehicle}</TableCell>
                  <TableCell>{report.location}</TableCell>
                  <TableCell>{getStatusBadge(report.status)}</TableCell>
                  <TableCell>{report.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
