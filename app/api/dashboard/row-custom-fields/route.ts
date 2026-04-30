import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { type Prisma } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import {
  appRoleForDashboard,
  customFieldsAsRecord,
  normalizeCustomFieldInput,
} from "@/lib/dashboard-custom-columns";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  dashboard: z.enum(["ACCOUNTING", "LEGAL", "LOGISTICS", "CLIENT_SERVICE"]),
  rowId: z.string().min(1),
  fields: z.record(z.string(), z.unknown()),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const { dashboard, rowId, fields } = parsed.data;
  if (!session?.user?.role || !hasApiAccess(session.user.role, [appRoleForDashboard(dashboard)])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const cols = await prisma.dashboardCustomColumn.findMany({ where: { dashboard } });
  const colByKey = new Map(cols.map((c) => [c.key, c]));

  function applyPatch(existingJson: Prisma.JsonValue): Prisma.InputJsonValue {
    const base = { ...customFieldsAsRecord(existingJson) };
    for (const [k, raw] of Object.entries(fields)) {
      const def = colByKey.get(k);
      if (!def) continue;
      if (raw === "" || raw === null || raw === undefined) {
        delete base[k];
        continue;
      }
      const norm = normalizeCustomFieldInput(raw, def.fieldType);
      if (norm !== null) {
        base[k] = norm;
      }
    }
    return base as Prisma.InputJsonValue;
  }

  switch (dashboard) {
    case "ACCOUNTING": {
      const row = await prisma.accountingAct.findUnique({ where: { id: rowId } });
      if (!row) return NextResponse.json({ message: "Строка не найдена" }, { status: 404 });
      const next = applyPatch(row.customFields);
      const updated = await prisma.accountingAct.update({
        where: { id: rowId },
        data: { customFields: next },
      });
      return NextResponse.json(updated);
    }
    case "LEGAL": {
      const row = await prisma.legalContract.findUnique({ where: { id: rowId } });
      if (!row) return NextResponse.json({ message: "Строка не найдена" }, { status: 404 });
      const next = applyPatch(row.customFields);
      const updated = await prisma.legalContract.update({
        where: { id: rowId },
        data: { customFields: next },
      });
      return NextResponse.json(updated);
    }
    case "LOGISTICS": {
      const row = await prisma.logisticsContainer.findUnique({ where: { id: rowId } });
      if (!row) return NextResponse.json({ message: "Строка не найдена" }, { status: 404 });
      const next = applyPatch(row.customFields);
      const updated = await prisma.logisticsContainer.update({
        where: { id: rowId },
        data: { customFields: next },
      });
      return NextResponse.json(updated);
    }
    case "CLIENT_SERVICE": {
      const row = await prisma.clientServiceOrder.findUnique({ where: { id: rowId } });
      if (!row) return NextResponse.json({ message: "Строка не найдена" }, { status: 404 });
      const next = applyPatch(row.customFields);
      const updated = await prisma.clientServiceOrder.update({
        where: { id: rowId },
        data: { customFields: next },
      });
      return NextResponse.json(updated);
    }
    default:
      return NextResponse.json({ message: "Неизвестный раздел" }, { status: 400 });
  }
}
