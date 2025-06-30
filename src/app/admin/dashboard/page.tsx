
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
  AlertTriangle,
  CheckCircle2,
  Truck,
  Wrench,
  ClipboardCheck,
  ClipboardX,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const locations = ["BP Pekanbaru", "BP Baung", "BP Dumai", "BP IKN"];

const recentReports = [
  {
    operator: "Umar Santoso",
    vehicleId: "EX-01",
    vehicle: "Excavator EX-01",
    location: locations[0],
    status: "Perlu Perhatian",
    date: "2024-05-20",
  },
  {
    operator: "Aep Saefudin",
    vehicleId: "DT-05",
    vehicle: "Dump Truck DT-05",
    location: locations[1],
    status: "Baik",
    date: "2024-05-20",
  },
  {
    operator: "Amirul",
    vehicleId: "BD-02",
    vehicle: "Bulldozer BD-02",
    location: locations[0],
    status: "Rusak",
    date: "2024-05-19",
  },
  {
    operator: "Solihin",
    vehicleId: "GD-03",
    vehicle: "Grader GD-03",
    location: locations[2],
    status: "Baik",
    date: "2024-05-19",
  },
  {
    operator: "Siswanto",
    vehicleId: "CP-01",
    vehicle: "Compactor CP-01",
    location: locations[1],
    status: "Baik",
    date: "2024-05-18",
  },
];

const allVehicles: {id: string; type: string; operator: string; location: string; status: string}[] = [
  // Rusak (2)
  { id: "BD-02", type: "Bulldozer", operator: "Amirul", location: locations[0], status: "Rusak" },
  { id: "BD-04", type: "Bulldozer", operator: "Amirul", location: locations[1], status: "Rusak" },

  // Perlu Perhatian (5)
  { id: "EX-01", type: "Excavator", operator: "Umar Santoso", location: locations[0], status: "Perlu Perhatian" },
  { id: "DT-06", type: "Dump Truck", operator: "Umar Santoso", location: locations[0], status: "Perlu Perhatian" },
  { id: "DT-07", type: "Dump Truck", operator: "Solihin", location: locations[2], status: "Perlu Perhatian" },
  { id: "GR-01", type: "Grader", operator: "Aep Saefudin", location: locations[1], status: "Perlu Perhatian"},
  { id: "CP-02", type: "Compactor", operator: "Siswanto", location: locations[3], status: "Perlu Perhatian"},

  // Baik (65)
  { id: "DT-05", type: "Dump Truck", operator: "Aep Saefudin", location: locations[1], status: "Baik" },
  { id: "GD-03", type: "Grader", operator: "Solihin", location: locations[2], status: "Baik" },
  { id: "CP-01", type: "Compactor", operator: "Siswanto", location: locations[1], status: "Baik" },
  ...Array.from({ length: 62 }, (_, i) => ({
    id: `BAIK-${String(i + 1).padStart(3, '0')}`,
    type: "Various",
    status: "Baik",
    location: locations[i % locations.length],
    operator: `Operator ${i+1}`
  }))
].sort((a, b) => a.id.localeCompare(b.id));

const checkedInVehicleIds = recentReports.map(r => r.vehicleId);
const checkedInVehicles = allVehicles.filter(v => checkedInVehicleIds.includes(v.id));
const notCheckedInVehicles = allVehicles.filter(v => !checkedInVehicleIds.includes(v.id));

const StatCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card className="hover:bg-muted/50 transition-colors">
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

const DetailTable = ({ vehicles, statusFilter }: { vehicles: typeof allVehicles, statusFilter?: string }) => {
  const filteredVehicles = statusFilter ? vehicles.filter(v => v.status === statusFilter) : vehicles;
  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID Kendaraan</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Lokasi</TableHead>
            <TableHead>Operator</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredVehicles.map((vehicle) => (
            <TableRow key={vehicle.id}>
              <TableCell className="font-medium">{vehicle.id}</TableCell>
              <TableCell>{vehicle.type}</TableCell>
              <TableCell>{vehicle.location}</TableCell>
              <TableCell>{vehicle.operator}</TableCell>
              <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
};

export default function DashboardPage() {
  const totalCount = allVehicles.length;
  const baikCount = allVehicles.filter((v) => v.status === "Baik").length;
  const rusakCount = allVehicles.filter((v) => v.status === "Rusak").length;
  const perhatianCount = allVehicles.filter((v) => v.status === "Perlu Perhatian").length;
  const checkedInCount = checkedInVehicles.length;
  const notCheckedInCount = notCheckedInVehicles.length;

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
              {locations.map(loc => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Total Alat" value={`${totalCount}`} icon={Truck} description="Total semua alat berat" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Total Alat</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat yang terdaftar.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={allVehicles} />
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Sudah Checklist" value={`${checkedInCount}`} icon={ClipboardCheck} description="Alat yang sudah dicek hari ini" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Sudah Checklist</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar alat berat yang sudah melakukan checklist.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={checkedInVehicles} />
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Belum Checklist" value={`${notCheckedInCount}`} icon={ClipboardX} description="Alat yang belum dicek hari ini" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Belum Checklist</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar alat berat yang belum melakukan checklist.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={notCheckedInVehicles} />
            </DialogContent>
        </Dialog>

        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Baik" value={`${baikCount}`} icon={CheckCircle2} description="+5 dari kemarin" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Baik</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat dalam kondisi baik.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={allVehicles} statusFilter="Baik" />
            </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Perlu Perhatian" value={`${perhatianCount}`} icon={AlertTriangle} description="-2 dari kemarin" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Perlu Perhatian</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat yang memerlukan perhatian.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={allVehicles} statusFilter="Perlu Perhatian" />
            </DialogContent>
        </Dialog>
        
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer">
                    <StatCard title="Alat Rusak" value={`${rusakCount}`} icon={Wrench} description="+1 dari kemarin" />
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle>Detail Alat Rusak</DialogTitle>
                    <DialogDescription>
                        Berikut adalah daftar semua alat berat yang rusak.
                    </DialogDescription>
                </DialogHeader>
                <DetailTable vehicles={allVehicles} statusFilter="Rusak" />
            </DialogContent>
        </Dialog>
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
