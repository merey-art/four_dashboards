import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { appRoleForDashboard, slugifyColumnKey } from "@/lib/dashboard-custom-columns";
import { prisma } from "@/lib/prisma";

const dashboardSchema = z.enum(["ACCOUNTING", "LEGAL", "LOGISTICS", "CLIENT_SERVICE"]);
const fieldTypeSchema = z.enum(["TEXT", "NUMBER", "DATE", "BOOLEAN"]);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);
  const d = dashboardSchema.safeParse(url.searchParams.get("dashboard"));
  if (!d.success) {
    return NextResponse.json({ message: "Укажите параметр dashboard" }, { status: 400 });
  }

  const dashboard = d.data;
  if (!session?.user?.role || !hasApiAccess(session.user.role, [appRoleForDashboard(dashboard)])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const cols = await prisma.dashboardCustomColumn.findMany({
    where: { dashboard },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(cols);
}

const postSchema = z.object({
  dashboard: dashboardSchema,
  label: z.string().min(1).max(120),
  fieldType: fieldTypeSchema,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные формы" }, { status: 400 });
  }

  const { dashboard, label, fieldType } = parsed.data;
  if (!session?.user?.role || !hasApiAccess(session.user.role, [appRoleForDashboard(dashboard)])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const base = slugifyColumnKey(label);
  let key = base;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const candidate = attempt === 0 ? key : `${base}-${attempt}`;
    const clash = await prisma.dashboardCustomColumn.findUnique({
      where: { dashboard_key: { dashboard, key: candidate } },
    });
    if (!clash) {
      key = candidate;
      break;
    }
    if (attempt === 79) {
      return NextResponse.json({ message: "Не удалось создать уникальный ключ столбца" }, { status: 409 });
    }
  }

  const maxOrder = await prisma.dashboardCustomColumn.aggregate({
    where: { dashboard },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const col = await prisma.dashboardCustomColumn.create({
    data: {
      dashboard,
      key,
      label: label.trim(),
      fieldType,
      sortOrder,
    },
  });

  return NextResponse.json(col);
}
