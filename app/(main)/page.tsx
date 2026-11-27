import { HeartPulseIcon, QrCode, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const healthcareImage =
  "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85')";

export default function Home() {
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

      <section className="relative z-10 flex min-h-svh flex-col justify-between px-7 py-8 text-white sm:px-12 sm:py-10 md:justify-center md:bg-white md:px-16 md:py-14 md:text-foreground lg:px-20">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2.5"
          aria-label="Afia Care home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-white text-primary md:bg-primary md:text-primary-foreground">
            <HeartPulseIcon className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Afia Care</span>
        </Link>

        <div className="mt-auto space-y-7 pb-4 pt-16 md:my-auto md:space-y-8 md:pb-0 md:pt-0">
          <div className="space-y-3 max-w-sm mx-auto">
            <p className="text-sm font-medium text-white/75 md:text-primary">People and wellbeing</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-4xl lg:text-5xl">
              Care for every part of your workday.
            </h1>
            <p className="text-sm leading-6 text-white/80 md:text-muted-foreground">
              Manage attendance and stay connected with your care team.
            </p>
          </div>

          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            <Button
              nativeButton={false}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 md:bg-primary md:text-primary-foreground md:hover:bg-primary/90"
              render={<Link href="/sign-in" />}
            >
              Masuk <User className="size-4" />
            </Button>
            <Button
              nativeButton={false}
              size="lg"
              variant="outline"
              className="border-white/50 bg-white/10 text-white md:hover:text-foreground hover:bg-white/20 md:border-border md:bg-background md:text-foreground md:hover:bg-muted"
              render={<Link href="/kiosk" />}
            >
              Tampilkan QR Presensi <QrCode className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-label="Healthcare team"
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
          Afia Care | People first
        </p>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Care that moves with your team.
          </h2>
          <p className="text-sm leading-6 text-white/80">
            Support every shift with simple, connected attendance and wellbeing tools.
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
