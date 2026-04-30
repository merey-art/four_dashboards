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
import { AccountingDialogs } from "@/components/dashboards/accounting-toolbar";
import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";
import { DashboardColumnManager } from "@/components/dashboards/dashboard-column-manager";
import { RowCustomFieldsButton } from "@/components/dashboards/row-custom-fields-button";
import { StatusBadge } from "@/components/status-badge";
import { customFieldsAsRecord, formatCustomFieldCell } from "@/lib/dashboard-custom-columns";
import { formatDateRu } from "@/lib/i18n";
import { parseIsoDateRange, prismaDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function AccountingPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const drift = prismaDateRange(parseIsoDateRange(searchParams));

  const where = drift ? { actDate: drift } : {};

  const [rows, customColumns] = await Promise.all([
    prisma.accountingAct.findMany({
      where,
      orderBy: { actDate: "desc" },
    }),
    prisma.dashboardCustomColumn.findMany({
      where: { dashboard: "ACCOUNTING" },
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

  const recoSuppliers = rows.filter((r) => r.actKind === "RECONCILIATION" && r.party === "SUPPLIER").length;
  const recoClients = rows.filter((r) => r.actKind === "RECONCILIATION" && r.party === "CLIENT").length;
  const origSuppliers = rows.filter((r) => r.actKind === "ORIGINAL_ACT" && r.party === "SUPPLIER").length;
  const origClients = rows.filter((r) => r.actKind === "ORIGINAL_ACT" && r.party === "CLIENT").length;

  const suppliersRows = rows.filter((r) => r.party === "SUPPLIER");
  const clientsRows = rows.filter((r) => r.party === "CLIENT");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Бухгалтерия</h1>
        <p className="mt-1 text-sm text-muted-foreground">Акты сверки и оригиналы по поставщикам и клиентам.</p>
      </div>

      <Suspense fallback={<div className="h-16 rounded-lg border bg-card" />}>
        <DashboardDateFilter />
      </Suspense>

      <AccountingDialogs />

      <DashboardColumnManager dashboard="ACCOUNTING" initialColumns={customColumnViews} />

      <div className="grid gap-3 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Сверки с поставщиками</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{recoSuppliers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Сверки с клиентами</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{recoClients}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Оригиналы от поставщиков</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{origSuppliers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Оригиналы от клиентов</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{origClients}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Поставщики</CardTitle>
            <CardDescription>Имя, дата акта, оригинал получен</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Наименование</TableHead>
                  <TableHead>Дата акта</TableHead>
                  <TableHead>Оригинал</TableHead>
                  {customColumnViews.map((col) => (
                    <TableHead key={col.id}>{col.label}</TableHead>
                  ))}
                  {customColumnViews.length > 0 ? <TableHead className="w-10 text-right" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliersRows.map((r) => {
                  const fi = customFieldsAsRecord(r.customFields);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.counterpartName}</TableCell>
                      <TableCell>{formatDateRu(r.actDate)}</TableCell>
                      <TableCell>
                        <StatusBadge tone={r.originalReceived ? "success" : "destructive"}>
                          {r.originalReceived ? "Да" : "Нет"}
                        </StatusBadge>
                      </TableCell>
                      {customColumnViews.map((col) => (
                        <TableCell key={col.key}>{formatCustomFieldCell(fi[col.key], col.fieldType)}</TableCell>
                      ))}
                      {customColumnViews.length > 0 ? (
                        <TableCell className="text-right">
                          <RowCustomFieldsButton
                            dashboard="ACCOUNTING"
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
        <Card>
          <CardHeader>
            <CardTitle>Клиенты</CardTitle>
            <CardDescription>Имя, дата акта, оригинал получен</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Наименование</TableHead>
                  <TableHead>Дата акта</TableHead>
                  <TableHead>Оригинал</TableHead>
                  {customColumnViews.map((col) => (
                    <TableHead key={col.id}>{col.label}</TableHead>
                  ))}
                  {customColumnViews.length > 0 ? <TableHead className="w-10 text-right" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsRows.map((r) => {
                  const fi = customFieldsAsRecord(r.customFields);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.counterpartName}</TableCell>
                      <TableCell>{formatDateRu(r.actDate)}</TableCell>
                      <TableCell>
                        <StatusBadge tone={r.originalReceived ? "success" : "destructive"}>
                          {r.originalReceived ? "Да" : "Нет"}
                        </StatusBadge>
                      </TableCell>
                      {customColumnViews.map((col) => (
                        <TableCell key={col.key}>{formatCustomFieldCell(fi[col.key], col.fieldType)}</TableCell>
                      ))}
                      {customColumnViews.length > 0 ? (
                        <TableCell className="text-right">
                          <RowCustomFieldsButton
                            dashboard="ACCOUNTING"
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
    </div>
  );
}
