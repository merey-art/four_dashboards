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
import { BuiltinColumnLabelsEditor } from "@/components/dashboards/builtin-column-labels-editor";
import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";
import { CustomColumnTableHead } from "@/components/dashboards/custom-column-table-head";
import { EditDashboardRowButton } from "@/components/dashboards/edit-dashboard-row-button";
import { LegalDialogs } from "@/components/dashboards/legal-toolbar";
import { StatusBadge } from "@/components/status-badge";
import { builtinLabelEditorItems, mergedBuiltinLabels } from "@/lib/builtin-table-columns";
import { customFieldsAsRecord, formatCustomFieldCell } from "@/lib/dashboard-custom-columns";
import { formatDateRu, ruLegalParty, ruLegalPhase } from "@/lib/i18n";
import { parseIsoDateRange, prismaDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function LegalPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const drift = prismaDateRange(parseIsoDateRange(searchParams));

  const where = drift ? { contractDate: drift } : {};

  const [rows, customColumns, builtinOverrides] = await Promise.all([
    prisma.legalContract.findMany({
      where,
      orderBy: { contractDate: "desc" },
    }),
    prisma.dashboardCustomColumn.findMany({
      where: { dashboard: "LEGAL" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.dashboardBuiltinColumnLabel.findMany({
      where: { dashboard: "LEGAL" },
    }),
  ]);

  const builtinLabelItems = builtinLabelEditorItems("LEGAL", builtinOverrides);
  const bl = mergedBuiltinLabels("LEGAL", builtinOverrides);

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

      <BuiltinColumnLabelsEditor
        dashboard="LEGAL"
        initialBuiltinItems={builtinLabelItems}
        initialCustomColumns={customColumnViews}
      />

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
                <TableHead>{bl.counterparty}</TableHead>
                <TableHead>{bl.partyType}</TableHead>
                <TableHead>{bl.phase}</TableHead>
                <TableHead>{bl.originalReceived}</TableHead>
                <TableHead>{bl.contractDate}</TableHead>
                {customColumnViews.map((col) => (
                  <CustomColumnTableHead key={col.id} column={col} />
                ))}
                <TableHead className="w-10 text-right" />
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
                    <TableCell className="text-right">
                      <EditDashboardRowButton
                        dashboard="LEGAL"
                        rowId={r.id}
                        labels={bl}
                        row={{
                          counterparty: r.counterparty,
                          partyType: r.partyType,
                          phase: r.phase,
                          originalReceived: r.originalReceived,
                          contractDate: r.contractDate,
                        }}
                        customColumns={customColumnViews}
                        customFields={r.customFields}
                      />
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
