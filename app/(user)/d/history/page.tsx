import { CalendarDaysIcon, Clock3Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const history = [
  { date: "Jumat, 27 Nov", shift: "Pagi", checkIn: "07:42", checkOut: "14:06", status: "Hadir" },
  { date: "Kamis, 26 Nov", shift: "Pagi", checkIn: "07:51", checkOut: "14:02", status: "Hadir" },
  { date: "Rabu, 25 Nov", shift: "Pagi", checkIn: "08:13", checkOut: "14:01", status: "Terlambat" },
  { date: "Selasa, 24 Nov", shift: "Pagi", checkIn: "07:46", checkOut: "14:10", status: "Hadir" },
];

export default function EmployeeHistoryPage() {
  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="text-xl font-semibold">Riwayat presensi</h1>
        <p className="text-sm text-muted-foreground">Ringkasan catatan kehadiran Anda.</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-primary">
            <CalendarDaysIcon className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Bulan ini</p>
            <p className="font-semibold">18 hari hadir</p>
          </div>
          <Badge variant="secondary">Demo</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitas terbaru</CardTitle>
          <CardDescription>Data contoh presensi harian.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {history.map((item) => (
            <div key={item.date} className="flex items-center gap-3 border-b py-3 last:border-0">
              <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
                <Clock3Icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{item.date}</p>
                <p className="text-xs text-muted-foreground">
                  Shift {item.shift} · {item.checkIn} - {item.checkOut}
                </p>
              </div>
              <Badge variant={item.status === "Terlambat" ? "outline" : "secondary"}>
                {item.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
