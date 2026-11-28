import { BottomNav } from "@/components/user-portal/bottom-nav";
import { PortalHeader } from "@/components/user-portal/portal-header";

export default function UserPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-svh bg-muted/40">
      <div className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col border-x bg-background shadow-sm">
        <PortalHeader />
        <main className="-mt-5 flex-1 rounded-t-3xl bg-[#faf9f8] pb-20">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
