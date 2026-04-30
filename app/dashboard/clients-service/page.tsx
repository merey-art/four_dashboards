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
import { ClientServiceDialogs } from "@/components/dashboards/clients-service-toolbar";
import { RowCustomFieldsButton } from "@/components/dashboards/row-custom-fields-button";
import { StatusBadge } from "@/components/status-badge";
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

  const [orders, customColumns] = await Promise.all([
    prisma.clientServiceOrder.findMany({
      where: drift ? { expectedDelivery: drift } : {},
      orderBy: { expectedDelivery: "asc" },
    }),
    prisma.dashboardCustomColumn.findMany({
      where: { dashboard: "CLIENT_SERVICE" },
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

      <DashboardColumnManager dashboard="CLIENT_SERVICE" initialColumns={customColumnViews} />

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
                {customColumnViews.map((col) => (
                  <TableHead key={col.id}>{col.label}</TableHead>
                ))}
                {customColumnViews.length > 0 ? <TableHead className="w-10 text-right" /> : null}
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
                    {customColumnViews.length > 0 ? (
                      <TableCell className="text-right">
                        <RowCustomFieldsButton
                          dashboard="CLIENT_SERVICE"
                          rowId={o.id}
                          columns={customColumnViews}
                          customFields={o.customFields}
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
