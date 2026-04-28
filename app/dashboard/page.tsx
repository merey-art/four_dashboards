import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowRight } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";
import { DASHBOARD_PATHS, defaultPostLoginHref } from "@/lib/constants";

const cards = [
  {
    title: "Клиентский сервис",
    desc: "Заказы клиентов, коды, сроки поставки",
    href: `/dashboard/${DASHBOARD_PATHS.clientService}`,
  },
  {
    title: "Логистика",
    desc: "Контейнеры и пограничные стыки",
    href: `/dashboard/${DASHBOARD_PATHS.logistics}`,
  },
  {
    title: "Юр. блок",
    desc: "Договоры и оригиналы",
    href: `/dashboard/${DASHBOARD_PATHS.legal}`,
  },
  {
    title: "Бухгалтерия",
    desc: "Акты сверки и оригиналы",
    href: `/dashboard/${DASHBOARD_PATHS.accounting}`,
  },
];

export default async function DashboardHomePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "DIRECTOR") {
    redirect(defaultPostLoginHref(session.user.role));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Панель директора</h1>
        <p className="mt-1 text-sm text-muted-foreground">Выберите раздел для просмотра показателей и таблиц.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <CardDescription className="mt-1">{c.desc}</CardDescription>
                </div>
                <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
