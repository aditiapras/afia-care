import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const permits = [
  {
    type: "Cuti",
    period: "30 Nov - 1 Des 2026",
    reason: "Keperluan keluarga",
    status: "Menunggu",
  },
  {
    type: "Sakit",
    period: "12 Nov 2026",
    reason: "Pemeriksaan kesehatan",
    status: "Disetujui",
  },
];

export default function EmployeePermitsPage() {
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Work permit</h1>
          <p className="text-sm text-muted-foreground">Riwayat permohonan Anda.</p>
        </div>
        <Button nativeButton={false} size="icon" render={<Link href="/d/permits/new" />}>
          <PlusIcon />
          <span className="sr-only">Ajukan work permit</span>
        </Button>
      </div>

      <Button
        nativeButton={false}
        render={<Link href="/d/permits/new" />}
        className="w-full"
      >
        <PlusIcon />
        Ajukan work permit
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permohonan saya</CardTitle>
          <CardDescription>Status dan periode permohonan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {permits.map((permit) => (
            <div
              key={`${permit.type}-${permit.period}`}
              className="flex items-start justify-between gap-3 rounded-lg border p-3"
            >
              <div className="space-y-1">
                <p className="font-medium">{permit.type}</p>
                <p className="text-sm">{permit.period}</p>
                <p className="text-xs text-muted-foreground">{permit.reason}</p>
              </div>
              <Badge variant={permit.status === "Disetujui" ? "secondary" : "outline"}>
                {permit.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Data contoh. Riwayat akan tersimpan setelah backend permit tersedia.
      </p>
    </div>
  );
}
