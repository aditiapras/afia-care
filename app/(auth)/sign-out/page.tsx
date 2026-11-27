"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    authClient.signOut({
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
        },
        onSuccess: () => {
          toast.success("Signed out");
          router.push("/sign-in");
        },
      },
    });
  }, [router]);

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-stone-100 p-4 dark:bg-black">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Signing out</CardTitle>
          <CardDescription>Please wait...</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
