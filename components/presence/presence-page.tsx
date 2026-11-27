"use client";

import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarDaysIcon,
  DownloadIcon,
  SearchIcon,
  SearchXIcon,
} from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

type AttendanceRecord = {
  employeeId: string;
  name: string;
  initials: string;
  department: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: "Hadir" | "Terlambat" | "Tidak hadir";
};

const departments = ["Klinik", "Keperawatan", "Operasional", "Farmasi"];

const demoAttendance: AttendanceRecord[] = [
  { employeeId: "EMP-001", name: "Aisha Rahman", initials: "AR", department: "Keperawatan", date: "2026-11-27", checkIn: "07:42", checkOut: "15:03", status: "Hadir" },
  { employeeId: "EMP-002", name: "Daniel Tan", initials: "DT", department: "Operasional", date: "2026-11-27", checkIn: "08:03", checkOut: "17:02", status: "Terlambat" },
  { employeeId: "EMP-003", name: "Mei Lin", initials: "ML", department: "Klinik", date: "2026-11-27", checkIn: "07:55", checkOut: "16:00", status: "Hadir" },
  { employeeId: "EMP-004", name: "Sarah Lim", initials: "SL", department: "Farmasi", date: "2026-11-27", checkIn: "--", checkOut: "--", status: "Tidak hadir" },
  { employeeId: "EMP-005", name: "Raj Kumar", initials: "RK", department: "Operasional", date: "2026-11-27", checkIn: "08:11", checkOut: "17:10", status: "Terlambat" },
  { employeeId: "EMP-001", name: "Aisha Rahman", initials: "AR", department: "Keperawatan", date: "2026-11-26", checkIn: "07:48", checkOut: "15:04", status: "Hadir" },
  { employeeId: "EMP-006", name: "Farah Aziz", initials: "FA", department: "Farmasi", date: "2026-11-26", checkIn: "08:02", checkOut: "16:01", status: "Hadir" },
  { employeeId: "EMP-003", name: "Mei Lin", initials: "ML", department: "Klinik", date: "2026-11-25", checkIn: "08:14", checkOut: "16:05", status: "Terlambat" },
  { employeeId: "EMP-007", name: "Noah Lee", initials: "NL", department: "Keperawatan", date: "2026-11-25", checkIn: "07:39", checkOut: "15:00", status: "Hadir" },
];

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function PresencePage() {
  const [department, setDepartment] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [attendanceDate, setAttendanceDate] = useState<Date>();
  const [results, setResults] = useState<AttendanceRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [exportRange, setExportRange] = useState<DateRange>();

  const employeeOptions = Array.from(
    new Map(
      demoAttendance
        .filter((record) => record.department === department)
        .map((record) => [record.employeeId, record.name]),
    ),
    ([id, name]) => ({ id, name }),
  );

  function clearResults() {
    setHasSearched(false);
    setResults([]);
  }

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!department || !employeeId || !attendanceDate) return;

    const selectedDate = format(attendanceDate, "yyyy-MM-dd");
    const matchingRecords = demoAttendance.filter(
      (record) =>
        record.department === department &&
        record.employeeId === employeeId &&
        record.date === selectedDate,
    );

    setResults(matchingRecords);
    setHasSearched(true);
  }

  function handleExport() {
    if (!exportRange?.from || !exportRange.to) return;

    const range = {
      start: startOfDay(exportRange.from),
      end: endOfDay(exportRange.to),
    };
    const records = demoAttendance.filter((record) =>
      isWithinInterval(parseISO(record.date), range),
    );

    if (records.length === 0) {
      toast.error("Tidak ada data presensi pada periode tersebut.");
      return;
    }

    const rows = [
      ["ID Karyawan", "Nama", "Bagian", "Tanggal", "Check-in", "Check-out", "Status"],
      ...records.map((record) => [
        record.employeeId,
        record.name,
        record.department,
        record.date,
        record.checkIn,
        record.checkOut,
        record.status,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `presensi-${format(exportRange.from, "yyyyMMdd")}-${format(exportRange.to, "yyyyMMdd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${records.length} baris presensi berhasil diunduh.`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Presensi</h1>
        <p className="text-sm text-muted-foreground">
          Cari kehadiran karyawan berdasarkan bagian, nama, dan tanggal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter presensi</CardTitle>
          <CardDescription>
            Pilih semua filter lalu tekan cari untuk memuat hasil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel htmlFor="department">Bagian</FieldLabel>
                <Select
                  value={department}
                  onValueChange={(value) => {
                    setDepartment(value ?? "");
                    setEmployeeId("");
                    clearResults();
                  }}
                >
                  <SelectTrigger id="department" className="w-full">
                    <SelectValue placeholder="Pilih bagian" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="employee">Nama karyawan</FieldLabel>
                <Select
                  value={employeeId}
                  disabled={!department}
                  onValueChange={(value) => {
                    setEmployeeId(value ?? "");
                    clearResults();
                  }}
                >
                  <SelectTrigger id="employee" className="w-full">
                    <SelectValue placeholder={department ? "Pilih karyawan" : "Pilih bagian dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeOptions.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Tanggal presensi</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start font-normal"
                      />
                    }
                  >
                    <CalendarDaysIcon />
                    {attendanceDate
                      ? format(attendanceDate, "d MMMM yyyy", { locale: id })
                      : "Pilih tanggal"}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={attendanceDate}
                      onSelect={(date) => {
                        setAttendanceDate(date);
                        clearResults();
                      }}
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field className="justify-end">
                <FieldLabel className="invisible">Cari presensi</FieldLabel>
                <Button type="submit" disabled={!department || !employeeId || !attendanceDate}>
                  <SearchIcon />
                  Cari presensi
                </Button>
              </Field>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Unduh semua data presensi</CardTitle>
            <CardDescription>
              Pilih periode tanggal untuk mengunduh presensi semua karyawan sebagai CSV.
            </CardDescription>
          </div>
          <DownloadIcon className="hidden size-5 text-muted-foreground sm:block" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field className="flex-1">
            <FieldLabel>Periode tanggal</FieldLabel>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start font-normal"
                  />
                }
              >
                <CalendarDaysIcon />
                {exportRange?.from
                  ? exportRange.to
                    ? `${format(exportRange.from, "d MMM yyyy", { locale: id })} - ${format(exportRange.to, "d MMM yyyy", { locale: id })}`
                    : `${format(exportRange.from, "d MMM yyyy", { locale: id })} - Pilih tanggal akhir`
                  : "Pilih tanggal mulai dan akhir"}
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="range"
                  selected={exportRange}
                  onSelect={setExportRange}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
          </Field>
          <Button
            type="button"
            onClick={handleExport}
            disabled={!exportRange?.from || !exportRange.to}
          >
            <DownloadIcon />
            Unduh CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Hasil presensi</CardTitle>
            <CardDescription>
              {hasSearched
                ? `${results.length} data ditemukan untuk filter yang dipilih.`
                : "Data hanya dimuat setelah pencarian dilakukan."}
            </CardDescription>
          </div>
          <Badge variant="outline">Data demo</Badge>
        </CardHeader>
        <CardContent>
          {!hasSearched ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
              <SearchIcon className="size-8 text-muted-foreground" />
              <p className="font-medium">Belum ada pencarian</p>
              <p className="text-sm text-muted-foreground">
                Pilih bagian, nama karyawan, dan tanggal untuk menampilkan data.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-10 text-center">
              <SearchXIcon className="size-8 text-muted-foreground" />
              <p className="font-medium">Data tidak ditemukan</p>
              <p className="text-sm text-muted-foreground">
                Tidak ada presensi yang sesuai dengan filter tersebut.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Bagian</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((record) => (
                  <TableRow key={`${record.employeeId}-${record.date}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>{record.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{record.name}</p>
                          <p className="text-xs text-muted-foreground">{record.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(record.date), "d MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{record.checkIn}</TableCell>
                    <TableCell className="font-mono text-xs">{record.checkOut}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "Tidak hadir"
                            ? "destructive"
                            : record.status === "Terlambat"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
