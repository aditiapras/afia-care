"use client";

import Link from "next/link";
import { LogOutIcon, UserRoundIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";

export default function EmployeeProfilePage() {
  const { data: session } = authClient.useSession();
  const name = session?.user.name || "Karyawan";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Profil</h1>
        <p className="text-sm text-muted-foreground">Informasi akun Anda.</p>
      </div>
      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="size-16">
            <AvatarFallback>
              {initials || <UserRoundIcon className="size-6" />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-lg">{name}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {session?.user.email || "Memuat akun..."}
        </CardContent>
      </Card>
      <Button
        nativeButton={false}
        variant="outline"
        className="w-full"
        render={<Link href="/sign-out" />}
      >
        <LogOutIcon />
        Keluar
      </Button>
    </div>
  );
}
