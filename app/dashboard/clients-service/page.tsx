import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardDateFilter } from "@/components/dashboard-date-filter";
import { StatusBadge } from "@/components/status-badge";
import { ClientServiceDialogs } from "@/components/dashboards/clients-service-toolbar";
import { formatDateRu, badgeCode } from "@/lib/i18n";
import { parseIsoDateRange, prismaDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function ClientServicePage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const sp = searchParams;
  const range = parseIsoDateRange({ from: sp.from, to: sp.to });
  const drift = prismaDateRange(range);

  const orders = await prisma.clientServiceOrder.findMany({
    where: drift ? { expectedDelivery: drift } : {},
    orderBy: { expectedDelivery: "asc" },
  });

  const total = orders.length;
  const codesIssued = orders.filter((o) => o.codeIssued).length;
  const codesPending = total - codesIssued;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Клиентский сервис</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Заказы по клиентам, коды таможни и графики поставок.
        </p>
      </div>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-card" />}>
        <DashboardDateFilter />
      </Suspense>

      <ClientServiceDialogs />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Всего заказов (в фильтре)</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Коды выданы</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-emerald-700">{codesIssued}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ожидают кодов</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-amber-700">{codesPending}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Заказы</CardTitle>
          <CardDescription>Фильтр по ожидаемой дате поставки</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Номер заказа</TableHead>
                <TableHead className="text-right">Кол-во конт.</TableHead>
                <TableHead>Ожид. дата</TableHead>
                <TableHead>Статус кода</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const b = badgeCode(o.codeIssued);
                return (
                  <TableRow key={o.id}>
                    <TableCell>{o.clientName}</TableCell>
                    <TableCell className="font-mono">{o.orderNumber}</TableCell>
                    <TableCell className="text-right">{o.quantity}</TableCell>
                    <TableCell>{formatDateRu(o.expectedDelivery)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={b.variant === "success" ? "success" : "warning"}>{b.label}</StatusBadge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
