import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { appRoleForDashboard } from "@/lib/dashboard-custom-columns";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  fieldType: z.enum(["TEXT", "NUMBER", "DATE", "BOOLEAN"]).optional(),
});

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const { id } = ctx.params;
  if (!id) {
    return NextResponse.json({ message: "Нет id" }, { status: 400 });
  }

  const existing = await prisma.dashboardCustomColumn.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Столбец не найден" }, { status: 404 });
  }

  if (!session?.user?.role || !hasApiAccess(session.user.role, [appRoleForDashboard(existing.dashboard)])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const updated = await prisma.dashboardCustomColumn.update({
    where: { id },
    data: {
      ...(parsed.data.label !== undefined ? { label: parsed.data.label.trim() } : {}),
      ...(parsed.data.fieldType !== undefined ? { fieldType: parsed.data.fieldType } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const { id } = ctx.params;
  if (!id) {
    return NextResponse.json({ message: "Нет id" }, { status: 400 });
  }

  const existing = await prisma.dashboardCustomColumn.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Столбец не найден" }, { status: 404 });
  }

  if (!session?.user?.role || !hasApiAccess(session.user.role, [appRoleForDashboard(existing.dashboard)])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  await prisma.dashboardCustomColumn.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
