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
import { LegalDialogs } from "@/components/dashboards/legal-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { formatDateRu, ruLegalParty, ruLegalPhase } from "@/lib/i18n";
import { parseIsoDateRange, prismaDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LegalPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const drift = prismaDateRange(parseIsoDateRange(searchParams));

  const where = drift ? { contractDate: drift } : {};

  const rows = await prisma.legalContract.findMany({
    where,
    orderBy: { contractDate: "desc" },
  });

  const signing = rows.filter((r) => r.phase === "SIGNING").length;
  const clientOriginals = rows.filter((r) => r.partyType === "CLIENT" && r.originalReceived).length;
  const supplierOriginals = rows.filter((r) => r.partyType === "SUPPLIER" && r.originalReceived).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Юр. блок</h1>
        <p className="mt-1 text-sm text-muted-foreground">Договоры и оригиналы документов.</p>
      </div>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-card" />}>
        <DashboardDateFilter />
      </Suspense>

      <LegalDialogs />

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Договоры на подписании</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{signing}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Оригиналы клиентов получены</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-emerald-700">{clientOriginals}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Оригиналы поставщиков получены</CardDescription>
            <CardTitle className="text-3xl tabular-nums text-emerald-700">{supplierOriginals}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Договоры</CardTitle>
          <CardDescription>Фильтр по дате договора</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Контрагент</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Оригинал</TableHead>
                <TableHead>Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const badge = r.originalReceived
                  ? ({ label: "Да", tone: "success" } as const)
                  : ({ label: "Нет", tone: "destructive" } as const);
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.counterparty}</TableCell>
                    <TableCell>{ruLegalParty[r.partyType] ?? r.partyType}</TableCell>
                    <TableCell>
                      <StatusBadge tone={r.phase === "SIGNING" ? "warning" : "muted"}>
                        {ruLegalPhase[r.phase] ?? r.phase}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
                    </TableCell>
                    <TableCell>{formatDateRu(r.contractDate)}</TableCell>
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
