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
import { LogisticsBorderFilter, LogisticsDialogs } from "@/components/dashboards/logistics-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { ruLogisticsStatus } from "@/lib/i18n";
import { prismaDateRange, parseIsoDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

function toneFor(status: string): "success" | "warning" | "destructive" | "muted" {
  switch (status) {
    case "SHIPPED":
      return "success";
    case "NOT_DEPARTED":
      return "destructive";
    case "IN_TRANSIT_BORDER":
      return "warning";
    default:
      return "muted";
  }
}

export default async function LogisticsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; border?: string };
}) {
  const range = parseIsoDateRange(searchParams);
  const drift = prismaDateRange(range);
  const border = searchParams.border;

  const where = {
    ...(drift ? { createdAt: drift } : {}),
    ...(border ? { borderCrossing: border } : {}),
  };

  const rows = await prisma.logisticsContainer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const count = (s: string) => rows.filter((r) => r.status === s).length;

  const borders = (
    await prisma.logisticsContainer.findMany({
      distinct: ["borderCrossing"],
      select: { borderCrossing: true },
      orderBy: { borderCrossing: "asc" },
    })
  ).map((b) => b.borderCrossing);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Логистика</h1>
        <p className="mt-1 text-sm text-muted-foreground">Положение грузов и формирование отправок.</p>
      </div>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-card" />}>
        <DashboardDateFilter />
      </Suspense>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-card" />}>
        <LogisticsBorderFilter borders={borders} />
      </Suspense>

      <LogisticsDialogs />

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>На земле по погран. стыкам</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{count("ON_GROUND_BORDER")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>В ходу на погран. стыки</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{count("IN_TRANSIT_BORDER")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Отгружено</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-emerald-700">{count("SHIPPED")}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Не вышедшие</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-red-700">{count("NOT_DEPARTED")}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Контейнеры</CardTitle>
          <CardDescription>Фильтр по дате создания записи и пограничному стыку</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Контейнер</TableHead>
                <TableHead>Погран. стык</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.containerNumber}</TableCell>
                  <TableCell>{r.borderCrossing}</TableCell>
                  <TableCell>
                    <StatusBadge tone={toneFor(r.status)}>{ruLogisticsStatus[r.status] ?? r.status}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.routeNote ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
