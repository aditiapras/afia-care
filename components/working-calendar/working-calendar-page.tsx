"use client";

import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import {
  CalendarDaysIcon,
  CheckIcon,
  Clock3Icon,
  RotateCcwIcon,
  SaveIcon,
  UsersRoundIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
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

const employees = [
  { id: "EMP-001", name: "Aisha Rahman", initials: "AR", department: "Keperawatan" },
  { id: "EMP-002", name: "Daniel Tan", initials: "DT", department: "Operasional" },
  { id: "EMP-003", name: "Mei Lin", initials: "ML", department: "Klinik" },
  { id: "EMP-004", name: "Sarah Lim", initials: "SL", department: "Farmasi" },
  { id: "EMP-005", name: "Raj Kumar", initials: "RK", department: "Operasional" },
  { id: "EMP-006", name: "Farah Aziz", initials: "FA", department: "Farmasi" },
];

const weekdays = [
  { key: "mon", label: "Senin" },
  { key: "tue", label: "Selasa" },
  { key: "wed", label: "Rabu" },
  { key: "thu", label: "Kamis" },
  { key: "fri", label: "Jumat" },
  { key: "sat", label: "Sabtu" },
  { key: "sun", label: "Minggu" },
] as const;

type WeekdayKey = (typeof weekdays)[number]["key"];
type WeeklyPattern = Record<string, Record<WeekdayKey, string>>;

const shiftOptions = [
  { value: "pagi", label: "Pagi", hours: "07:00-14:00" },
  { value: "siang", label: "Siang", hours: "14:00-22:00" },
  { value: "full", label: "Full", hours: "07:00-22:00" },
  { value: "off", label: "Libur", hours: "" },
];

const initialWeeklyPattern: WeeklyPattern = {
  "EMP-001": { mon: "pagi", tue: "pagi", wed: "pagi", thu: "pagi", fri: "pagi", sat: "off", sun: "off" },
  "EMP-002": { mon: "siang", tue: "siang", wed: "siang", thu: "siang", fri: "siang", sat: "off", sun: "off" },
  "EMP-003": { mon: "pagi", tue: "pagi", wed: "siang", thu: "pagi", fri: "pagi", sat: "off", sun: "off" },
  "EMP-004": { mon: "siang", tue: "siang", wed: "siang", thu: "siang", fri: "siang", sat: "pagi", sun: "off" },
  "EMP-005": { mon: "pagi", tue: "pagi", wed: "pagi", thu: "pagi", fri: "pagi", sat: "pagi", sun: "off" },
  "EMP-006": { mon: "pagi", tue: "pagi", wed: "pagi", thu: "pagi", fri: "pagi", sat: "off", sun: "off" },
};

type ScheduleOverride = {
  id: string;
  employeeId: string;
  date: string;
  shift: string;
};

const initialOverrides: ScheduleOverride[] = [
  { id: "OVR-001", employeeId: "EMP-001", date: "2026-11-30", shift: "Libur" },
  { id: "OVR-002", employeeId: "EMP-002", date: "2026-12-01", shift: "Pagi" },
  { id: "OVR-003", employeeId: "EMP-003", date: "2026-12-03", shift: "Libur" },
];

export function WorkingCalendarPage() {
  const [weeklyPattern, setWeeklyPattern] = useState(initialWeeklyPattern);
  const [overrides, setOverrides] = useState(initialOverrides);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedShift, setSelectedShift] = useState("off");

  function updateWeeklyPattern(employeeId: string, day: WeekdayKey, shift: string | null) {
    setWeeklyPattern((current) => ({
      ...current,
      [employeeId]: {
        ...current[employeeId],
        [day]: shift ?? "off",
      },
    }));
  }

  function saveWeeklyPattern() {
    toast.success("Pola jadwal disimpan (demo).");
  }

  function addOverride() {
    if (!selectedEmployeeId || !selectedDate) return;

    const dateKey = format(selectedDate, "yyyy-MM-dd");
    const employee = employees.find((item) => item.id === selectedEmployeeId);
    if (!employee) return;

    const selectedShiftOption = shiftOptions.find((option) => option.value === selectedShift);
    const override: ScheduleOverride = {
      id: `${selectedEmployeeId}-${dateKey}`,
      employeeId: selectedEmployeeId,
      date: dateKey,
      shift: selectedShiftOption?.value === "off" ? "Libur" : selectedShiftOption?.label ?? "Libur",
    };

    setOverrides((current) => [
      override,
      ...current.filter((item) => !(item.employeeId === selectedEmployeeId && item.date === dateKey)),
    ]);
    setSelectedDate(undefined);
    toast.success(`Jadwal khusus untuk ${employee.name} ditambahkan (demo).`);
  }

  function removeOverride(override: ScheduleOverride) {
    setOverrides((current) => current.filter((item) => item.id !== override.id));
    toast.success("Pengecualian dihapus. Pola mingguan kembali berlaku (demo).");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Working calendar</h1>
          <p className="text-sm text-muted-foreground">
            Atur pola shift mingguan dan hari libur khusus setiap karyawan.
          </p>
        </div>
        <Badge variant="outline">Data demo</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>Karyawan terjadwal</CardDescription>
              <CardTitle className="text-3xl">{employees.length}</CardTitle>
            </div>
            <UsersRoundIcon className="size-5 text-muted-foreground" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>Shift tersedia</CardDescription>
              <CardTitle className="text-3xl">{shiftOptions.length - 1}</CardTitle>
            </div>
            <Clock3Icon className="size-5 text-muted-foreground" />
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardDescription>Pengecualian tanggal</CardDescription>
              <CardTitle className="text-3xl">{overrides.length}</CardTitle>
            </div>
            <CalendarDaysIcon className="size-5 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Pola jadwal mingguan</CardTitle>
            <CardDescription>
              Atur shift berulang. Pilih Libur untuk hari tanpa jadwal kerja.
            </CardDescription>
          </div>
          <Button onClick={saveWeeklyPattern}>
            <SaveIcon />
            Simpan pola
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            {shiftOptions.slice(0, 3).map((shift) => (
              <Badge key={shift.value} variant="outline">
                {shift.label} {shift.hours}
              </Badge>
            ))}
            <Badge variant="secondary">Libur</Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Karyawan</TableHead>
                {weekdays.map((day) => (
                  <TableHead key={day.key}>{day.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="min-w-48">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback>{employee.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">{employee.department}</p>
                      </div>
                    </div>
                  </TableCell>
                  {weekdays.map((day) => (
                    <TableCell key={day.key}>
                      <Select
                        value={weeklyPattern[employee.id][day.key]}
                        onValueChange={(value) =>
                          updateWeeklyPattern(employee.id, day.key, value)
                        }
                      >
                        <SelectTrigger aria-label={`${employee.name}, ${day.label}`} className="min-w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {shiftOptions.map((shift) => (
                            <SelectItem key={shift.value} value={shift.value}>
                              {shift.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(20rem,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Pengecualian jadwal</CardTitle>
            <CardDescription>
              Ubah shift atau tetapkan hari libur karyawan pada tanggal tertentu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Field>
                <FieldLabel>Karyawan</FieldLabel>
                <Select value={selectedEmployeeId} onValueChange={(value) => setSelectedEmployeeId(value ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih karyawan" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>Tanggal</FieldLabel>
                <Popover>
                  <PopoverTrigger
                    render={
                      <Button type="button" variant="outline" className="w-full justify-start font-normal" />
                    }
                  >
                    <CalendarDaysIcon />
                    {selectedDate ? format(selectedDate, "d MMM yyyy", { locale: id }) : "Pilih tanggal"}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={id} />
                  </PopoverContent>
                </Popover>
              </Field>

              <Field>
                <FieldLabel>Jadwal tanggal ini</FieldLabel>
                <Select value={selectedShift} onValueChange={(value) => setSelectedShift(value ?? "off")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftOptions.map((shift) => (
                      <SelectItem key={shift.value} value={shift.value}>
                        {shift.label}{shift.hours ? ` - ${shift.hours}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field className="justify-end">
                <FieldLabel className="invisible">Tambah pengecualian</FieldLabel>
                <Button
                  onClick={addOverride}
                  disabled={!selectedEmployeeId || !selectedDate}
                >
                  <CheckIcon />
                  Terapkan
                </Button>
              </Field>
            </div>

            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Jadwal khusus</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.map((override) => {
                    const employee = employees.find((item) => item.id === override.employeeId);
                    return (
                      <TableRow key={override.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(parseISO(override.date), "EEEE, d MMM yyyy", { locale: id })}
                        </TableCell>
                        <TableCell>{employee?.name ?? override.employeeId}</TableCell>
                        <TableCell>
                          <Badge variant={override.shift === "Libur" ? "secondary" : "outline"}>
                            {override.shift}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOverride(override)}
                            aria-label={`Hapus pengecualian ${override.id}`}
                          >
                            <RotateCcwIcon />
                            Pulihkan pola
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dampak ke absensi</CardTitle>
            <CardDescription>Urutan jadwal yang dipakai saat memeriksa kehadiran.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Badge variant="outline">1</Badge>
              <p className="text-sm">Pengecualian karyawan pada tanggal tertentu.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">2</Badge>
              <p className="text-sm">Hari libur umum yang terdaftar.</p>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline">3</Badge>
              <p className="text-sm">Pola kerja mingguan karyawan.</p>
            </div>
            <div className="flex items-start gap-3 border-t pt-4 text-muted-foreground">
              <XIcon className="mt-0.5 size-4 shrink-0" />
              <p className="text-sm">
                Jika tidak ada jadwal yang berlaku, karyawan dianggap tidak terjadwal, bukan otomatis absen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
