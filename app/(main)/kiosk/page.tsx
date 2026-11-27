"use client";

import { ReactQRCode } from "@lglab/react-qr-code";
import { ArrowLeftIcon, HeartPulseIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const REFRESH_MS = 30_000;
const healthcareImage =
  "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85')";

export default function KioskPage() {
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const rotate = () => {
      setToken(crypto.randomUUID());
      setExpiresAt(Date.now() + REFRESH_MS);
    };
    rotate();
    const rotateTimer = setInterval(rotate, REFRESH_MS);
    const tickTimer = setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      clearInterval(rotateTimer);
      clearInterval(tickTimer);
    };
  }, []);

  const secondsLeft = Math.max(0, Math.ceil((expiresAt - now) / 1_000));
  const progress = (secondsLeft / (REFRESH_MS / 1_000)) * 100;

  return (
    <main className="relative isolate min-h-svh w-full overflow-hidden bg-white md:grid md:grid-cols-2">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center md:hidden"
        style={{ backgroundImage: healthcareImage }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-primary/75 mix-blend-multiply md:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-primary/45 to-primary/95 md:hidden"
      />

      <section className="relative z-10 flex min-h-svh flex-col px-7 py-8 text-white sm:px-12 sm:py-10 md:justify-center md:bg-white md:px-16 md:py-14 md:text-foreground lg:px-20">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2.5"
          aria-label="Kembali ke beranda Afia Care"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-primary md:bg-primary md:text-primary-foreground">
            <HeartPulseIcon className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Afia Care</span>
        </Link>

        <div className="my-auto flex flex-col items-center py-10 text-center md:items-start md:text-left mx-auto gap-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-white/75 md:text-primary">Presence</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Scan untuk absensi
            </h1>
            <p className="text-sm leading-6 text-white/80 md:text-muted-foreground">
              Arahkan kamera ke QR code ini untuk mencatat kehadiran.
            </p>
          </div>

          <div className="rounded-xl bg-white shadow-[0_24px_70px_-24px_rgba(0,0,0,0.35)] mx-auto">
            {token && (
              <ReactQRCode
                value={token}
                size={220}
                background="#ffffff"
                aria-label="QR code absensi"
              />
            )}
          </div>

          <div className="mt-5 w-full max-w-sm space-y-2 mx-auto">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-white/80 md:text-muted-foreground">QR diperbarui dalam</span>
              <span className="font-mono font-semibold tabular-nums">{secondsLeft}s</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/25 md:bg-primary/10">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-1000 md:bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/85 underline-offset-4 hover:underline md:text-primary mx-auto"
          >
            <ArrowLeftIcon className="size-4" />
            Kembali ke beranda
          </Link>
        </div>
      </section>

      <section
        aria-label="Afia Care"
        className="relative isolate hidden min-h-svh flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex lg:p-14"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: healthcareImage }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-primary/70 mix-blend-multiply"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-gradient-to-b from-primary/15 via-primary/35 to-primary/95"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 z-0 size-80 rounded-full border border-white/20"
        />

        <p className="relative z-10 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
          Afia Care · People first
        </p>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Your presence makes a difference.
          </h2>
          <p className="text-sm leading-6 text-white/80">
            A simple scan keeps your care team connected and ready for the day.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-white/85">
          <span className="flex size-10 items-center justify-center rounded-xl border border-white/25 bg-white/15 backdrop-blur-sm">
            <HeartPulseIcon className="size-5" />
          </span>
          <span>Care teams, connected.</span>
        </div>
      </section>
    </main>
  );
}
