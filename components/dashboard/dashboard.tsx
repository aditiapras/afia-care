import {
  ActivityIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  Clock3Icon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconTone: string;
}[] = [
  {
    label: "Total employees",
    value: "128",
    detail: "Across 4 departments",
    icon: UsersRoundIcon,
    iconTone: "bg-sky-100 text-sky-700",
  },
  {
    label: "Present today",
    value: "112",
    detail: "87.5% of the workforce",
    icon: ActivityIcon,
    iconTone: "bg-emerald-100 text-emerald-700",
  },
  {
    label: "Late arrivals",
    value: "8",
    detail: "6.3% of today's workforce",
    icon: Clock3Icon,
    iconTone: "bg-amber-100 text-amber-700",
  },
  {
    label: "Pending work permits",
    value: "7",
    detail: "3 need review today",
    icon: ClipboardListIcon,
    iconTone: "bg-rose-100 text-rose-700",
  },
];

const attendance = [
  { name: "Aisha Rahman", initials: "AR", department: "Nursing", time: "07:42", status: "On time" },
  { name: "Daniel Tan", initials: "DT", department: "Operations", time: "08:03", status: "Late" },
  { name: "Mei Lin", initials: "ML", department: "Clinic", time: "07:55", status: "On time" },
  { name: "Sarah Lim", initials: "SL", department: "Pharmacy", time: "--", status: "Absent" },
  { name: "Raj Kumar", initials: "RK", department: "Facilities", time: "08:11", status: "Late" },
];

const permits = [
  { employee: "Aisha Rahman", type: "Overtime", date: "27 Nov 2026", status: "Pending" },
  { employee: "Daniel Tan", type: "Site access", date: "28 Nov 2026", status: "Pending" },
  { employee: "Mei Lin", type: "Shift swap", date: "29 Nov 2026", status: "Approved" },
  { employee: "Raj Kumar", type: "Equipment transfer", date: "30 Nov 2026", status: "Pending" },
];

const schedule = [
  { date: "TODAY · 27 NOV", title: "Day shift", detail: "Nursing team · 07:00-15:00" },
  { date: "SAT · 28 NOV", title: "Weekend clinic", detail: "Clinic team · 08:00-16:00" },
  { date: "MON · 30 NOV", title: "Public health clinic", detail: "Community team · 09:00-17:00" },
];

export function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/10 via-background to-sky-500/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border-[32px] border-primary/5" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="space-y-3">
            <Badge variant="outline" className="bg-background/70">Demo snapshot · 27 Nov 2026</Badge>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Good morning, team.</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Here&apos;s your workforce snapshot for today.
              </p>
            </div>
          </div>
          <div className="w-full max-w-xs space-y-3 sm:w-64">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ActivityIcon className="size-4 text-primary" />
                Attendance rate
              </span>
              <span className="font-semibold">87.5%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-background/80"
              role="progressbar"
              aria-label="Attendance rate"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={87.5}
            >
              <div className="h-full w-[87.5%] rounded-full bg-primary" />
            </div>
            <p className="text-xs text-muted-foreground">112 of 128 employees checked in</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, icon: Icon, iconTone }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-3xl">{value}</CardTitle>
              </div>
              <span className={`flex size-10 items-center justify-center rounded-lg ${iconTone}`}>
                <Icon className="size-5" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s attendance</CardTitle>
            <CardDescription>Recent check-ins across the organization.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback>{record.initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{record.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell className="font-mono text-xs">{record.time}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "Absent"
                            ? "destructive"
                            : record.status === "Late"
                              ? "outline"
                              : "secondary"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Work permit requests</CardTitle>
              <CardDescription>Requests waiting for or completing review.</CardDescription>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardListIcon className="size-5" />
            </span>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Request</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permits.map((permit) => (
                  <TableRow key={`${permit.employee}-${permit.type}`}>
                    <TableCell className="font-medium">{permit.employee}</TableCell>
                    <TableCell>{permit.type}</TableCell>
                    <TableCell className="whitespace-nowrap">{permit.date}</TableCell>
                    <TableCell>
                      <Badge variant={permit.status === "Approved" ? "secondary" : "outline"}>
                        {permit.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
            <CalendarDaysIcon className="size-5" />
          </span>
          <div className="space-y-1">
            <CardTitle>Upcoming working calendar</CardTitle>
            <CardDescription>Example team shifts and scheduled activities.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {schedule.map((item, index) => (
            <div key={item.title} className="flex gap-3 rounded-lg border p-4">
              <div className="flex flex-col items-center">
                <span className={`mt-1 size-2.5 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                {index < schedule.length - 1 && <span className="mt-1 h-full w-px bg-border" />}
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-medium tracking-wide text-muted-foreground">{item.date}</p>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
