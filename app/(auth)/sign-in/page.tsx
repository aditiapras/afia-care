"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRightIcon, HeartPulseIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { signInSchema, type SignInValues } from "@/lib/validations/auth";

export default function SignInPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    const { data, error } = await authClient.signIn.username(values, {
      onError: (ctx) => {
        toast.error(ctx.error.message);
      },
    });
    if (!error) {
      toast.success("Signed in");
      router.push(data?.user.role === "admin" ? "/p" : "/d");
    }
  }

  return (
    <div className="grid min-h-svh w-full bg-white md:grid-cols-2">
      <section className="flex flex-col px-7 py-8 sm:px-12 sm:py-10 lg:px-16">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5" aria-label="Afia Care home">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <HeartPulseIcon className="size-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Afia Care</span>
        </Link>

        <div className="flex w-full flex-1 flex-col justify-center py-12 max-w-sm mx-auto">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-medium text-primary">Welcome back</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Sign in to your account</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Enter your username and password to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FieldGroup className="gap-5">
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="Your username"
                  aria-invalid={!!errors.username}
                  className="h-10 bg-stone-50 px-4"
                  {...register("username")}
                />
                <FieldError errors={[errors.username]} />
              </Field>
              <Field data-invalid={!!errors.password}>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={!!errors.password}
                  className="h-10 bg-stone-50 px-4"
                  {...register("password")}
                />
                <FieldError errors={[errors.password]} />
              </Field>
            </FieldGroup>

            <Button type="submit" size="lg" className="h-10 w-full text-sm" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
              {!isSubmitting && <ArrowRightIcon data-icon="inline-end" />}
            </Button>
          </form>

          <p className="mt-7 text-center text-xs text-muted-foreground">
            Don&apos;t have an account? Please contact your administrator.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">© 2026 Afia Care. All rights reserved.</p>
      </section>

      <section
        aria-label="Healthcare team"
        className="relative isolate hidden flex-col justify-between overflow-hidden bg-primary text-primary-foreground md:flex md:min-h-svh md:p-10 lg:p-14"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 scale-105 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=85')",
          }}
        />
        <div aria-hidden="true" className="absolute inset-0 z-0 bg-primary/70 mix-blend-multiply" />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 bg-gradient-to-b from-primary/20 via-primary/35 to-primary/95"
        />
        <div aria-hidden="true" className="absolute -right-24 -top-24 z-0 size-80 rounded-full border border-white/20" />

        <div className="relative z-10 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
          <span className="size-2 rounded-full bg-white" />
          People and wellbeing
        </div>

        <div className="relative z-10 space-y-5">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 backdrop-blur-sm">
            <HeartPulseIcon className="size-7" />
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">
            Every shift starts with care.
          </h2>
          <p className="max-w-sm text-base leading-7 text-white/80">
            A healthier workplace begins with people who feel supported, connected, and ready for every day.
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/25 pt-5 text-sm text-white/75">
          <span>Care teams, connected.</span>
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-1.5 rounded-full bg-white" />
            <span className="size-1.5 rounded-full bg-white/45" />
            <span className="size-1.5 rounded-full bg-white/45" />
          </span>
        </div>
      </section>
    </div>
  );
}
