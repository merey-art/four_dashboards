import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const statuses = ["ON_GROUND_BORDER", "IN_TRANSIT_BORDER", "SHIPPED", "NOT_DEPARTED"] as const;

const patchSchema = z
  .object({
    containerNumber: z.string().min(1).optional(),
    borderCrossing: z.string().min(1).optional(),
    routeNote: z.string().nullable().optional(),
    status: z.enum(statuses).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Нет полей для обновления" });

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["LOGISTICS"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = ctx.params;
  const existing = await prisma.logisticsContainer.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Запись не найдена" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const data = parsed.data;
  const routeNote =
    data.routeNote !== undefined
      ? data.routeNote === null || String(data.routeNote).trim() === ""
        ? null
        : data.routeNote
      : undefined;
  const updated = await prisma.logisticsContainer.update({
    where: { id },
    data: {
      ...(data.containerNumber !== undefined ? { containerNumber: data.containerNumber } : {}),
      ...(data.borderCrossing !== undefined ? { borderCrossing: data.borderCrossing } : {}),
      ...(data.routeNote !== undefined ? { routeNote } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
    },
  });

  return NextResponse.json(updated);
}
