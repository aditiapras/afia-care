"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileCheck2Icon,
  HistoryIcon,
  PlaneIcon,
  QrCodeIcon,
  ShieldPlusIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function EmployeeHomePage() {
  const { data: session } = authClient.useSession();
  const firstName = session?.user.name.split(" ")[0] || "Karyawan";

  return (
    <div className="space-y-6 px-4 pb-6 pt-5">
      <Card className="-mt-9 border-0 shadow-md">
        <CardContent className="flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">PRESENSI HARI INI</p>
            <p className="mt-1 text-lg font-semibold">Belum check-in</p>
            <p className="text-sm text-muted-foreground">Shift Pagi · 07:00-14:00</p>
          </div>
          <Badge variant="outline" className="shrink-0">Demo</Badge>
        </CardContent>
      </Card>

      <nav aria-label="Kategori beranda" className="-mx-4 flex gap-5 overflow-x-auto border-b px-4">
        <a href="#untuk-anda" className="shrink-0 border-b-2 border-primary pb-2 text-sm font-semibold text-primary">Untuk Anda</a>
        <a href="#presensi" className="shrink-0 pb-2 text-sm text-muted-foreground">Presensi</a>
        <a href="#jadwal" className="shrink-0 pb-2 text-sm text-muted-foreground">Jadwal</a>
        <a href="#aktivitas" className="shrink-0 pb-2 text-sm text-muted-foreground">Aktivitas</a>
      </nav>

      <section id="untuk-anda" className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Apa kabar, {firstName}?</h1>
          <p className="text-sm text-muted-foreground">Akses cepat untuk aktivitas kerja Anda.</p>
        </div>
        <div className="grid grid-cols-4 gap-y-5">
          {[
            { label: "Scan QR", href: "/d/scan", icon: QrCodeIcon },
            { label: "Ajukan izin", href: "/d/permits/new", icon: PlaneIcon },
            { label: "Jadwal saya", href: "#jadwal", icon: CalendarDaysIcon },
            { label: "Riwayat", href: "/d/history", icon: HistoryIcon },
          ].map(({ label, href, icon: Icon }) => (
            <Link key={label} href={href} className="flex flex-col items-center gap-2 text-center">
              <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-primary">
                <Icon className="size-5" />
              </span>
              <span className="text-[11px] leading-tight text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section id="jadwal" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Jadwal & presensi</h2>
          <Link href="/d/scan" className="text-xs font-medium text-primary">Lihat presensi</Link>
        </div>
        <Card id="presensi" className="overflow-hidden">
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-rose-50 text-primary">
                <Clock3Icon className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Shift Pagi</p>
                <p className="text-sm text-muted-foreground">Keperawatan · 07:00-14:00</p>
              </div>
            </div>
            <Badge variant="secondary">Hari ini</Badge>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Ringkasan Anda</h2>
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="space-y-2 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-rose-50 text-primary">
                <CalendarDaysIcon className="size-5" />
              </span>
              <p className="text-xs text-muted-foreground">Saldo cuti</p>
              <p className="text-xl font-semibold">8 <span className="text-sm font-normal">hari</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2Icon className="size-5" />
              </span>
              <p className="text-xs text-muted-foreground">Hadir bulan ini</p>
              <p className="text-xl font-semibold">18 <span className="text-sm font-normal">hari</span></p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="aktivitas" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Aktivitas terbaru</h2>
          <Link href="/d/permits" className="text-xs font-medium text-primary">Lihat semua</Link>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-700">
              <FileCheck2Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <CardTitle className="text-sm">Cuti tahunan</CardTitle>
              <CardDescription className="truncate">30 Nov - 1 Des · Menunggu persetujuan</CardDescription>
            </div>
            <ArrowRightIcon className="size-4 text-muted-foreground" />
          </CardHeader>
        </Card>
      </section>

      <Link
        href="/d/permits/new"
        className="flex items-center justify-between gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#8f171b] to-primary p-4 text-primary-foreground shadow-sm"
      >
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-white/75">Dukungan tim</p>
          <p className="font-semibold">Butuh izin atau cuti?</p>
          <p className="text-sm text-white/75">Kirim pengajuan dengan mudah.</p>
        </div>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white/15">
          <ShieldPlusIcon className="size-6" />
        </span>
      </Link>
    </div>
  );
}
