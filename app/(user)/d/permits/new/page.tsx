"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const permitSchema = z
  .object({
    type: z.enum(["sakit", "izin", "cuti"]),
    startDate: z.string().min(1, "Tanggal mulai wajib dipilih."),
    endDate: z.string().min(1, "Tanggal selesai wajib dipilih."),
    reason: z.string().trim().min(10, "Alasan minimal 10 karakter."),
  })
  .refine((values) => values.startDate <= values.endDate, {
    path: ["endDate"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });

type PermitFormValues = z.infer<typeof permitSchema>;

export default function NewPermitPage() {
  const {
    handleSubmit,
    register,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PermitFormValues>({
    resolver: zodResolver(permitSchema),
    defaultValues: { type: "izin", startDate: "", endDate: "", reason: "" },
  });
  const permitType = useWatch({ control, name: "type" });

  function onSubmit() {
    toast.info("Formulir demo: pengajuan belum disimpan ke server.");
  }

  return (
    <div className="space-y-5 p-4">
      <Button
        nativeButton={false}
        variant="ghost"
        size="sm"
        className="-ml-2"
        render={<Link href="/d/permits" />}
      >
        <ArrowLeftIcon />
        Kembali
      </Button>

      <div>
        <h1 className="text-2xl font-semibold">Ajukan work permit</h1>
        <p className="text-sm text-muted-foreground">
          Isi detail sakit, izin, atau cuti untuk ditinjau admin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detail pengajuan</CardTitle>
          <CardDescription>Kolom bertanda wajib diisi.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field data-invalid={!!errors.type}>
              <FieldLabel htmlFor="permit-type">Tipe pengajuan</FieldLabel>
              <Select
                value={permitType}
                onValueChange={(value) => {
                  if (value === "sakit" || value === "izin" || value === "cuti") {
                    setValue("type", value, { shouldValidate: true });
                  }
                }}
              >
                <SelectTrigger id="permit-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sakit">Sakit</SelectItem>
                  <SelectItem value="izin">Izin</SelectItem>
                  <SelectItem value="cuti">Cuti</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.type]} />
            </Field>

            <Field data-invalid={!!errors.startDate}>
              <FieldLabel htmlFor="start-date">Tanggal mulai</FieldLabel>
              <Input
                id="start-date"
                type="date"
                aria-invalid={!!errors.startDate}
                {...register("startDate")}
              />
              <FieldError errors={[errors.startDate]} />
            </Field>

            <Field data-invalid={!!errors.endDate}>
              <FieldLabel htmlFor="end-date">Tanggal selesai</FieldLabel>
              <Input
                id="end-date"
                type="date"
                aria-invalid={!!errors.endDate}
                {...register("endDate")}
              />
              <FieldError errors={[errors.endDate]} />
            </Field>

            <Field data-invalid={!!errors.reason}>
              <FieldLabel htmlFor="permit-reason">Alasan</FieldLabel>
              <Input
                id="permit-reason"
                placeholder="Jelaskan alasan pengajuan"
                aria-invalid={!!errors.reason}
                {...register("reason")}
              />
              <FieldError errors={[errors.reason]} />
            </Field>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Kirim pengajuan
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Demo UI: data belum dikirim atau disimpan.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
