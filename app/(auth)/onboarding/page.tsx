"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { onboardingSchema, type OnboardingValues } from "@/lib/validations/auth";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { displayUsername: "" },
  });

  useEffect(() => {
    if (session) reset({ displayUsername: session.user.displayUsername ?? session.user.username ?? "" });
  }, [session, reset]);

  async function onSubmit(values: OnboardingValues) {
    const { error } = await authClient.updateUser(values, {
      onError: (ctx) => {
        toast.error(ctx.error.message);
      },
    });
    if (!error) {
      toast.success("Profile updated");
      router.push("/");
    }
  }

  if (isPending) return <p className="text-center text-sm">Loading...</p>;
  if (!session) return <p className="text-center text-sm">Please sign in first.</p>;

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-stone-100 p-4 dark:bg-black">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, {session.user.name}</CardTitle>
          <CardDescription>Choose how your name is displayed.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!errors.displayUsername}>
                <FieldLabel htmlFor="displayUsername">Display username</FieldLabel>
                <Input id="displayUsername" placeholder="Display username" aria-invalid={!!errors.displayUsername} {...register("displayUsername")} />
                <FieldError errors={[errors.displayUsername]} />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
