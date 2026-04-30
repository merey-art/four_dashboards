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
import { ClientServiceDialogs } from "@/components/dashboards/clients-service-toolbar";
import { EditDashboardRowButton } from "@/components/dashboards/edit-dashboard-row-button";
import { StatusBadge } from "@/components/status-badge";
import { builtinLabelEditorItems, mergedBuiltinLabels } from "@/lib/builtin-table-columns";
import { customFieldsAsRecord, formatCustomFieldCell } from "@/lib/dashboard-custom-columns";
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

  const [orders, customColumns, builtinOverrides] = await Promise.all([
    prisma.clientServiceOrder.findMany({
      where: drift ? { expectedDelivery: drift } : {},
      orderBy: { expectedDelivery: "asc" },
    }),
    prisma.dashboardCustomColumn.findMany({
      where: { dashboard: "CLIENT_SERVICE" },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.dashboardBuiltinColumnLabel.findMany({
      where: { dashboard: "CLIENT_SERVICE" },
    }),
  ]);

  const builtinLabelItems = builtinLabelEditorItems("CLIENT_SERVICE", builtinOverrides);
  const bl = mergedBuiltinLabels("CLIENT_SERVICE", builtinOverrides);

  const customColumnViews: CustomColumnView[] = customColumns.map((c) => ({
    id: c.id,
    key: c.key,
    label: c.label,
    fieldType: c.fieldType,
    sortOrder: c.sortOrder,
  }));

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

      <BuiltinColumnLabelsEditor
        dashboard="CLIENT_SERVICE"
        initialBuiltinItems={builtinLabelItems}
        initialCustomColumns={customColumnViews}
      />

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
                <TableHead>{bl.clientName}</TableHead>
                <TableHead>{bl.orderNumber}</TableHead>
                <TableHead className="text-right">{bl.quantity}</TableHead>
                <TableHead>{bl.expectedDelivery}</TableHead>
                <TableHead>{bl.codeIssued}</TableHead>
                {customColumnViews.map((col) => (
                  <CustomColumnTableHead key={col.id} column={col} />
                ))}
                <TableHead className="w-10 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const b = badgeCode(o.codeIssued);
                const fi = customFieldsAsRecord(o.customFields);
                return (
                  <TableRow key={o.id}>
                    <TableCell>{o.clientName}</TableCell>
                    <TableCell className="font-mono">{o.orderNumber}</TableCell>
                    <TableCell className="text-right">{o.quantity}</TableCell>
                    <TableCell>{formatDateRu(o.expectedDelivery)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={b.variant === "success" ? "success" : "warning"}>{b.label}</StatusBadge>
                    </TableCell>
                    {customColumnViews.map((col) => (
                      <TableCell key={col.key}>{formatCustomFieldCell(fi[col.key], col.fieldType)}</TableCell>
                    ))}
                    <TableCell className="text-right">
                      <EditDashboardRowButton
                        dashboard="CLIENT_SERVICE"
                        rowId={o.id}
                        labels={bl}
                        row={{
                          clientName: o.clientName,
                          orderNumber: o.orderNumber,
                          quantity: o.quantity,
                          expectedDelivery: o.expectedDelivery,
                          codeIssued: o.codeIssued,
                        }}
                        customColumns={customColumnViews}
                        customFields={o.customFields}
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
