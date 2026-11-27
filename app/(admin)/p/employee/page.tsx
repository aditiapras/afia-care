import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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

const employees = [
  {
    id: "EMP-001",
    name: "Aisha Rahman",
    initials: "AR",
    email: "aisha.rahman@afiacare.example",
    department: "Keperawatan",
    shift: "Pagi - 07:00-15:00",
    joined: "12 Mar 2022",
    status: "Aktif",
  },
  {
    id: "EMP-002",
    name: "Daniel Tan",
    initials: "DT",
    email: "daniel.tan@afiacare.example",
    department: "Operasional",
    shift: "Siang - 09:00-17:00",
    joined: "4 Jul 2021",
    status: "Aktif",
  },
  {
    id: "EMP-003",
    name: "Mei Lin",
    initials: "ML",
    email: "mei.lin@afiacare.example",
    department: "Klinik",
    shift: "Pagi - 07:00-15:00",
    joined: "20 Jun 2023",
    status: "Aktif",
  },
  {
    id: "EMP-004",
    name: "Sarah Lim",
    initials: "SL",
    email: "sarah.lim@afiacare.example",
    department: "Farmasi",
    shift: "Malam - 15:00-23:00",
    joined: "1 Sep 2020",
    status: "Cuti",
  },
  {
    id: "EMP-005",
    name: "Raj Kumar",
    initials: "RK",
    email: "raj.kumar@afiacare.example",
    department: "Operasional",
    shift: "Malam - 15:00-23:00",
    joined: "15 Jan 2024",
    status: "Aktif",
  },
  {
    id: "EMP-006",
    name: "Farah Aziz",
    initials: "FA",
    email: "farah.aziz@afiacare.example",
    department: "Farmasi",
    shift: "Pagi - 07:00-15:00",
    joined: "6 Feb 2024",
    status: "Aktif",
  },
  {
    id: "EMP-007",
    name: "Noah Lee",
    initials: "NL",
    email: "noah.lee@afiacare.example",
    department: "Keperawatan",
    shift: "Malam - 15:00-23:00",
    joined: "9 Nov 2019",
    status: "Aktif",
  },
  {
    id: "EMP-008",
    name: "Hannah Wong",
    initials: "HW",
    email: "hannah.wong@afiacare.example",
    department: "Klinik",
    shift: "Siang - 09:00-17:00",
    joined: "18 Mei 2022",
    status: "Aktif",
  },
  {
    id: "EMP-009",
    name: "Amir Hassan",
    initials: "AH",
    email: "amir.hassan@afiacare.example",
    department: "Keperawatan",
    shift: "Pagi - 07:00-15:00",
    joined: "3 Apr 2025",
    status: "Aktif",
  },
];

export default function EmployeePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Karyawan</h1>
        <p className="text-sm text-muted-foreground">
          Direktori karyawan, bagian, jadwal shift, dan tanggal bergabung.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Semua karyawan</CardTitle>
            <CardDescription>{employees.length} data karyawan ditampilkan.</CardDescription>
          </div>
          <Badge variant="outline">Data demo</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Bagian</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Tanggal bergabung</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback>{employee.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell className="whitespace-nowrap">{employee.shift}</TableCell>
                  <TableCell className="whitespace-nowrap">{employee.joined}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "Cuti" ? "outline" : "secondary"}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
