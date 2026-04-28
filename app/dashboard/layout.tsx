import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { AppSidebar } from "@/components/app-sidebar";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen min-w-[1024px] flex-col">
      <header className="flex h-14 shrink-0 items-center border-b bg-slate-900 px-6 text-white">
        <div className="flex size-9 items-center justify-center rounded-md bg-white/15 text-xs font-bold">Л</div>
        <div className="ml-3">
          <div className="text-sm font-semibold leading-tight">ТОО «Коридор Евразии»</div>
          <div className="text-xs text-white/70">Логистика • Казахстан</div>
        </div>
        <div className="ml-auto text-right text-xs text-white/80">
          <div>{session.user.name}</div>
          <div className="text-white/60">{session.user.email}</div>
        </div>
      </header>
      <div className="flex flex-1">
        <AppSidebar role={session.user.role} />
        <main className="min-w-0 flex-1 bg-muted/20 p-6">{children}</main>
      </div>
    </div>
  );
}
