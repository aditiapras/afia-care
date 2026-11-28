"use client";

import {
  ClipboardListIcon,
  HouseIcon,
  HistoryIcon,
  ScanLineIcon,
  UserRoundIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Beranda", href: "/d", icon: HouseIcon },
  { label: "Riwayat", href: "/d/history", icon: HistoryIcon },
  { label: "Scan", href: "/d/scan", icon: ScanLineIcon, prominent: true },
  { label: "Izin", href: "/d/permits", icon: ClipboardListIcon },
  { label: "Profil", href: "/d/profile", icon: UserRoundIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto grid h-[72px] w-full max-w-[430px] grid-cols-5 border-t bg-white/95 px-1 pt-1 pb-[env(safe-area-inset-bottom)] shadow-lg backdrop-blur"
    >
      {items.map(({ label, href, icon: Icon, prominent }) => {
        const isActive =
          href === "/d"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-md text-[10px] font-medium transition-colors",
              prominent ? "-mt-5 gap-0.5" : "",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {prominent ? (
              <span className="grid size-14 place-items-center rounded-full border-4 border-white bg-primary text-primary-foreground shadow-md">
                <Icon className="size-6" />
              </span>
            ) : (
              <Icon className="size-5" />
            )}
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
