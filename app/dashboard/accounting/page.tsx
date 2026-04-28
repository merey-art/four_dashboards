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
import { StatusBadge } from "@/components/status-badge";
import { formatDateRu } from "@/lib/i18n";
import { parseIsoDateRange, prismaDateRange } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

export default async function AccountingPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const drift = prismaDateRange(parseIsoDateRange(searchParams));

  const where = drift ? { actDate: drift } : {};

  const rows = await prisma.accountingAct.findMany({
    where,
    orderBy: { actDate: "desc" },
  });

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliersRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.counterpartName}</TableCell>
                    <TableCell>{formatDateRu(r.actDate)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={r.originalReceived ? "success" : "destructive"}>
                        {r.originalReceived ? "Да" : "Нет"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.counterpartName}</TableCell>
                    <TableCell>{formatDateRu(r.actDate)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={r.originalReceived ? "success" : "destructive"}>
                        {r.originalReceived ? "Да" : "Нет"}
                      </StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
