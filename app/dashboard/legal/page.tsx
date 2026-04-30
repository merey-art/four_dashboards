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
import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";
import { DashboardColumnManager } from "@/components/dashboards/dashboard-column-manager";
import { LegalDialogs } from "@/components/dashboards/legal-toolbar";
import { RowCustomFieldsButton } from "@/components/dashboards/row-custom-fields-button";
import { StatusBadge } from "@/components/status-badge";
import { customFieldsAsRecord, formatCustomFieldCell } from "@/lib/dashboard-custom-columns";
import { formatDateRu, ruLegalParty, ruLegalPhase } from "@/lib/i18n";
import { parseIsoDateRange, prismaDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LegalPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const drift = prismaDateRange(parseIsoDateRange(searchParams));

  const where = drift ? { contractDate: drift } : {};

  const [rows, customColumns] = await Promise.all([
    prisma.legalContract.findMany({
      where,
      orderBy: { contractDate: "desc" },
    }),
    prisma.dashboardCustomColumn.findMany({
      where: { dashboard: "LEGAL" },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const customColumnViews: CustomColumnView[] = customColumns.map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    fieldType: c.fieldType,
    sortOrder: c.sortOrder,
  }));

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

      <DashboardColumnManager dashboard="LEGAL" initialColumns={customColumnViews} />

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
                {customColumnViews.map((col) => (
                  <TableHead key={col.id}>{col.label}</TableHead>
                ))}
                {customColumnViews.length > 0 ? <TableHead className="w-10 text-right" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const badge = r.originalReceived
                  ? ({ label: "Да", tone: "success" } as const)
                  : ({ label: "Нет", tone: "destructive" } as const);
                const fi = customFieldsAsRecord(r.customFields);
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
                    {customColumnViews.map((col) => (
                      <TableCell key={col.key}>{formatCustomFieldCell(fi[col.key], col.fieldType)}</TableCell>
                    ))}
                    {customColumnViews.length > 0 ? (
                      <TableCell className="text-right">
                        <RowCustomFieldsButton
                          dashboard="LEGAL"
                          rowId={r.id}
                          columns={customColumnViews}
                          customFields={r.customFields}
                        />
                      </TableCell>
                    ) : null}
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
