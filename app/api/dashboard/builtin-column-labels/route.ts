import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { appRoleForDashboard } from "@/lib/dashboard-custom-columns";
import { allowedBuiltinFieldKeys, defaultBuiltinLabel } from "@/lib/builtin-table-columns";
import { prisma } from "@/lib/prisma";
import type { DashboardKind } from "@prisma/client";

const dashboardSchema = z.enum(["ACCOUNTING", "LEGAL", "LOGISTICS", "CLIENT_SERVICE"]);

const patchSchema = z.object({
  dashboard: dashboardSchema,
  fieldKey: z.string().min(1).max(64),
  label: z.string().max(120).optional().nullable(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const { dashboard, fieldKey, label } = parsed.data;
  if (!session?.user?.role || !hasApiAccess(session.user.role, [appRoleForDashboard(dashboard as DashboardKind)])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  if (!allowedBuiltinFieldKeys(dashboard as DashboardKind).has(fieldKey)) {
    return NextResponse.json({ message: "Неизвестное поле" }, { status: 400 });
  }

  const trimmed = label?.trim();
  if (!trimmed || trimmed === defaultBuiltinLabel(dashboard as DashboardKind, fieldKey)) {
    await prisma.dashboardBuiltinColumnLabel.deleteMany({
      where: { dashboard, fieldKey },
    });
    return NextResponse.json({ ok: true, reset: true });
  }

  await prisma.dashboardBuiltinColumnLabel.upsert({
    where: { dashboard_fieldKey: { dashboard, fieldKey } },
    create: { dashboard, fieldKey, label: trimmed },
    update: { label: trimmed },
  });

  return NextResponse.json({ ok: true });
}
