import Link from "next/link";
import { CameraIcon, ShieldCheckIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmployeeScanPage() {
  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Scan presensi</h1>
        <p className="text-sm text-muted-foreground">
          Check-in dan check-out dengan QR di lokasi klinik.
        </p>
      </div>

      <Card>
        <CardContent className="flex aspect-[3/4] flex-col items-center justify-center gap-4 rounded-lg bg-muted/40 p-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-background text-muted-foreground shadow-sm">
            <CameraIcon className="size-8" />
          </span>
          <div className="space-y-2">
            <Badge variant="outline">Kamera belum terhubung</Badge>
            <p className="font-medium">Pemindai QR akan tampil di sini</p>
            <p className="text-sm text-muted-foreground">
              Akses kamera dan validasi token perlu dihubungkan ke layanan absensi sebelum scan dapat mencatat kehadiran.
            </p>
          </div>
          <ShieldCheckIcon className="size-5 text-muted-foreground" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sebelum melakukan presensi</CardTitle>
          <CardDescription>
            Pastikan Anda berada di lokasi kerja dan menggunakan QR kiosk yang sedang aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            nativeButton={false}
            variant="outline"
            className="w-full"
            render={<Link href="/d" />}
          >
            Kembali ke beranda
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
