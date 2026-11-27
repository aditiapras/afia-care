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
import { signUpSchema, type SignUpValues } from "@/lib/validations/auth";

const fields = [
  { name: "name", label: "Full name", type: "text", autoComplete: "name", placeholder: "Your full name" },
  { name: "username", label: "Username", type: "text", autoComplete: "username", placeholder: "Choose a username" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "you@example.com" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "Create a password" },
] as const;

export default function SignUpPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", username: "", email: "", password: "" },
  });

  async function onSubmit(values: SignUpValues) {
    const { error } = await authClient.signUp.email(values, {
      onError: (ctx) => {
        toast.error(ctx.error.message);
      },
    });
    if (!error) {
      toast.success("Account created");
      router.push("/onboarding");
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

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <div className="mb-6 space-y-2">
            <p className="text-sm font-medium text-primary">Get started</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Create your account</h1>
            <p className="text-sm leading-6 text-muted-foreground">
              Set up your Afia Care profile to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <FieldGroup className="gap-4">
              {fields.map(({ name, label, type, autoComplete, placeholder }) => (
                <Field key={name} data-invalid={!!errors[name]}>
                  <FieldLabel htmlFor={name}>{label}</FieldLabel>
                  <Input
                    id={name}
                    type={type}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    aria-invalid={!!errors[name]}
                    className="h-10 bg-stone-50 px-4"
                    {...register(name)}
                  />
                  <FieldError errors={[errors[name]]} />
                </Field>
              ))}
            </FieldGroup>

            <Button type="submit" size="lg" className="h-10 w-full text-sm" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
              {!isSubmitting && <ArrowRightIcon data-icon="inline-end" />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">2026 Afia Care. All rights reserved.</p>
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
            A healthier workplace starts with you.
          </h2>
          <p className="text-base leading-7 text-white/80">
            Join your care team and stay connected throughout every workday.
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
