"use client";

import { useState } from "react";
import {
  CheckIcon,
  Clock3Icon,
  FileTextIcon,
  SearchIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

type PermitType = "Sakit" | "Izin" | "Cuti";
type PermitStatus = "Menunggu" | "Disetujui" | "Ditolak" | "Dibatalkan";

type PermitRequest = {
  id: string;
  employeeId: string;
  employee: string;
  initials: string;
  department: string;
  type: PermitType;
  startDate: string;
  endDate: string;
  workDays: number;
  reason: string;
  attachment?: string;
  status: PermitStatus;
};

const initialRequests: PermitRequest[] = [
  {
    id: "PRM-2026-031",
    employeeId: "EMP-001",
    employee: "Aisha Rahman",
    initials: "AR",
    department: "Keperawatan",
    type: "Cuti",
    startDate: "30 Nov 2026",
    endDate: "1 Des 2026",
    workDays: 2,
    reason: "Keperluan keluarga",
    status: "Menunggu",
  },
  {
    id: "PRM-2026-030",
    employeeId: "EMP-002",
    employee: "Daniel Tan",
    initials: "DT",
    department: "Operasional",
    type: "Izin",
    startDate: "27 Nov 2026",
    endDate: "27 Nov 2026",
    workDays: 0.5,
    reason: "Keperluan pribadi pada pagi hari",
    status: "Menunggu",
  },
  {
    id: "PRM-2026-029",
    employeeId: "EMP-003",
    employee: "Mei Lin",
    initials: "ML",
    department: "Klinik",
    type: "Sakit",
    startDate: "26 Nov 2026",
    endDate: "26 Nov 2026",
    workDays: 1,
    reason: "Pemulihan dari demam",
    attachment: "surat-dokter.pdf",
    status: "Disetujui",
  },
  {
    id: "PRM-2026-028",
    employeeId: "EMP-004",
    employee: "Sarah Lim",
    initials: "SL",
    department: "Farmasi",
    type: "Cuti",
    startDate: "23 Nov 2026",
    endDate: "25 Nov 2026",
    workDays: 3,
    reason: "Perjalanan keluarga",
    status: "Disetujui",
  },
  {
    id: "PRM-2026-027",
    employeeId: "EMP-005",
    employee: "Raj Kumar",
    initials: "RK",
    department: "Operasional",
    type: "Izin",
    startDate: "20 Nov 2026",
    endDate: "20 Nov 2026",
    workDays: 0.5,
    reason: "Urusan keluarga",
    status: "Ditolak",
  },
  {
    id: "PRM-2026-026",
    employeeId: "EMP-006",
    employee: "Farah Aziz",
    initials: "FA",
    department: "Farmasi",
    type: "Cuti",
    startDate: "2 Des 2026",
    endDate: "3 Des 2026",
    workDays: 2,
    reason: "Acara keluarga",
    status: "Menunggu",
  },
  {
    id: "PRM-2026-025",
    employeeId: "EMP-007",
    employee: "Noah Lee",
    initials: "NL",
    department: "Keperawatan",
    type: "Sakit",
    startDate: "18 Nov 2026",
    endDate: "18 Nov 2026",
    workDays: 1,
    reason: "Pemeriksaan kesehatan",
    attachment: "medical-note.pdf",
    status: "Disetujui",
  },
  {
    id: "PRM-2026-024",
    employeeId: "EMP-008",
    employee: "Hannah Wong",
    initials: "HW",
    department: "Klinik",
    type: "Cuti",
    startDate: "10 Nov 2026",
    endDate: "12 Nov 2026",
    workDays: 3,
    reason: "Keperluan pribadi",
    status: "Dibatalkan",
  },
];

const leaveBalances = [
  { name: "Aisha Rahman", initials: "AR", used: 4, total: 12 },
  { name: "Daniel Tan", initials: "DT", used: 7, total: 12 },
  { name: "Mei Lin", initials: "ML", used: 2, total: 12 },
  { name: "Sarah Lim", initials: "SL", used: 9, total: 12 },
];

const statusVariant: Record<PermitStatus, "outline" | "secondary" | "destructive"> = {
  Menunggu: "outline",
  Disetujui: "secondary",
  Ditolak: "destructive",
  Dibatalkan: "outline",
};

export function WorkPermitPage() {
  const [requests, setRequests] = useState(initialRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const pendingCount = requests.filter((request) => request.status === "Menunggu").length;
  const approvedCount = requests.filter((request) => request.status === "Disetujui").length;
  const leaveCount = requests.filter(
    (request) => request.type === "Cuti" && request.status === "Menunggu",
  ).length;

  const filteredRequests = requests.filter((request) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      request.employee.toLowerCase().includes(query) ||
      request.employeeId.toLowerCase().includes(query) ||
      request.id.toLowerCase().includes(query);

    return (
      matchesSearch &&
      (statusFilter === "all" || request.status === statusFilter) &&
      (typeFilter === "all" || request.type === typeFilter)
    );
  });

  function reviewRequest(id: string, status: "Disetujui" | "Ditolak") {
    setRequests((current) =>
      current.map((request) => (request.id === id ? { ...request, status } : request)),
    );
    toast.success(`Permohonan ${id} ${status.toLowerCase()} (demo).`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Work permit</h1>
          <p className="text-sm text-muted-foreground">
            Tinjau permohonan sakit, izin, dan cuti karyawan.
          </p>
        </div>
        <Badge variant="outline">Data demo</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>Menunggu review</CardDescription>
              <CardTitle className="text-3xl">{pendingCount}</CardTitle>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock3Icon className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Termasuk {leaveCount} permohonan cuti.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>Disetujui</CardDescription>
              <CardTitle className="text-3xl">{approvedCount}</CardTitle>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckIcon className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Dari permohonan contoh yang ditampilkan.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>Total permohonan</CardDescription>
              <CardTitle className="text-3xl">{requests.length}</CardTitle>
            </div>
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UsersRoundIcon className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Permohonan izin dan cuti karyawan.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Daftar permohonan</CardTitle>
            <CardDescription>
              Periksa periode, alasan, dan lampiran sebelum mengambil keputusan.
            </CardDescription>
            <div className="flex flex-col gap-2 pt-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Cari karyawan atau nomor permohonan"
                  placeholder="Cari nama atau nomor permohonan"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? "all")}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="Menunggu">Menunggu</SelectItem>
                  <SelectItem value="Disetujui">Disetujui</SelectItem>
                  <SelectItem value="Ditolak">Ditolak</SelectItem>
                  <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value ?? "all")}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Semua tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua tipe</SelectItem>
                  <SelectItem value="Sakit">Sakit</SelectItem>
                  <SelectItem value="Izin">Izin</SelectItem>
                  <SelectItem value="Cuti">Cuti</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                Tidak ada permohonan yang sesuai dengan filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Hari kerja</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback>{request.initials}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-36">
                            <p className="font-medium">{request.employee}</p>
                            <p className="text-xs text-muted-foreground">
                              {request.employeeId} · {request.department}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{request.type}</Badge>
                      </TableCell>
                      <TableCell className="min-w-40">
                        <p className="whitespace-nowrap text-sm">
                          {request.startDate === request.endDate
                            ? request.startDate
                            : `${request.startDate} - ${request.endDate}`}
                        </p>
                        <p className="mt-1 max-w-52 text-xs text-muted-foreground">{request.reason}</p>
                        {request.attachment && (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                            <FileTextIcon className="size-3" />
                            {request.attachment}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{request.workDays} hari</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {request.status === "Menunggu" ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              aria-label={`Setujui ${request.id}`}
                              onClick={() => reviewRequest(request.id, "Disetujui")}
                            >
                              <CheckIcon />
                              Setujui
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label={`Tolak ${request.id}`}
                              onClick={() => reviewRequest(request.id, "Ditolak")}
                            >
                              <XIcon />
                            </Button>
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Saldo cuti</CardTitle>
              <CardDescription>Contoh sisa saldo karyawan tahun 2026.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {leaveBalances.map((balance) => {
                const remaining = balance.total - balance.used;
                const usedPercent = (balance.used / balance.total) * 100;

                return (
                  <div key={balance.name} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        <AvatarFallback>{balance.initials}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm font-medium">{balance.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {remaining}/{balance.total} hari
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-label={`Saldo cuti ${balance.name}`}
                      aria-valuemin={0}
                      aria-valuemax={balance.total}
                      aria-valuenow={remaining}
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${usedPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catatan review</CardTitle>
              <CardDescription>Hal yang perlu diperiksa sebelum menyetujui.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Pastikan periode tidak bertabrakan dengan permohonan lain yang masih aktif.</p>
              <p>Hari kerja cuti dihitung ulang saat permohonan disetujui.</p>
              <p>Lampiran sakit hanya dapat dilihat oleh karyawan dan admin.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
