"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Building2, ClipboardList, Briefcase, Landmark, Scale } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { DASHBOARD_PATHS, deptHomePath } from "@/lib/constants";
import type { AppRole } from "@/lib/constants";

const items: {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: AppRole[];
}[] = [
  {
    href: "/dashboard",
    label: "Обзор",
    icon: <Building2 className="size-4" />,
    roles: ["DIRECTOR"],
  },
  {
    href: `/dashboard/${DASHBOARD_PATHS.clientService}`,
    label: "Клиентский сервис",
    icon: <ClipboardList className="size-4" />,
    roles: ["DIRECTOR", "CLIENT_SERVICE"],
  },
  {
    href: `/dashboard/${DASHBOARD_PATHS.logistics}`,
    label: "Логистика",
    icon: <Briefcase className="size-4" />,
    roles: ["DIRECTOR", "LOGISTICS"],
  },
  {
    href: `/dashboard/${DASHBOARD_PATHS.legal}`,
    label: "Юр. блок",
    icon: <Scale className="size-4" />,
    roles: ["DIRECTOR", "LEGAL"],
  },
  {
    href: `/dashboard/${DASHBOARD_PATHS.accounting}`,
    label: "Бухгалтерия",
    icon: <Landmark className="size-4" />,
    roles: ["DIRECTOR", "ACCOUNTING"],
  },
];

export function AppSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const home = deptHomePath(role);

  const visible = items.filter((item) => item.roles.includes(role as AppRole));

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wide opacity-80">Разделы</div>
      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {visible.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-white/10 font-medium" : "hover:bg-white/5",
              )}
              aria-current={active ? "page" : undefined}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <Separator className="border-white/10" />
      <div className="p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full border-sidebar-foreground/30 text-sidebar-foreground hover:bg-white/10"
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Выйти
        </Button>
        <p className="mt-3 text-xs opacity-70">
          {home ? "Ваш раздел открыт автоматически при входе." : "Полный доступ ко всем разделам."}
        </p>
      </div>
    </aside>
  );
}
