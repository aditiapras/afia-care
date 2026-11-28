"use client";

import { BellIcon, HeartPulseIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";

export function PortalHeader() {
  const { data: session } = authClient.useSession();
  const name = session?.user.name || "Karyawan";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="relative isolate overflow-hidden bg-gradient-to-br from-[#a32225] via-primary to-[#74191c] px-5 pb-10 pt-5 text-primary-foreground">
      <div
        aria-hidden="true"
        className="absolute -right-16 top-8 size-48 rounded-full border border-white/10"
      />
      <div
        aria-hidden="true"
        className="absolute -right-8 top-16 size-32 rounded-full bg-white/5"
      />
      <div className="relative z-10 flex items-center justify-between">
        <Link href="/d" className="flex items-center gap-2" aria-label="Afia Care beranda">
          <HeartPulseIcon className="size-6" />
          <span className="text-lg font-bold tracking-tight">AFIA CARE</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/d/permits"
            aria-label="Notifikasi dan work permit"
            className="relative grid size-9 place-items-center rounded-full hover:bg-white/10"
          >
            <BellIcon className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-300" />
          </Link>
          <Link href="/d/profile" aria-label="Buka profil">
            <Avatar className="size-9 border border-white/50">
              <AvatarFallback className="bg-white text-primary">{initials || "AK"}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
      <div className="relative z-10 mt-7">
        <p className="text-sm text-white/75">Selamat pagi,</p>
        <p className="text-lg font-semibold">{name}!</p>
      </div>
    </header>
  );
}
