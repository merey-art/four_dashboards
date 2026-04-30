import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    clientName: z.string().min(1).optional(),
    orderNumber: z.string().min(1).optional(),
    quantity: z.coerce.number().int().positive().optional(),
    expectedDelivery: z.string().optional(),
    codeIssued: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Нет полей для обновления" });

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["CLIENT_SERVICE"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = ctx.params;
  const existing = await prisma.clientServiceOrder.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Запись не найдена" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const data = parsed.data;
  let expectedDelivery: Date | undefined;
  if (data.expectedDelivery !== undefined) {
    const d = new Date(data.expectedDelivery);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ message: "Некорректная дата" }, { status: 400 });
    }
    expectedDelivery = d;
  }

  const updated = await prisma.clientServiceOrder.update({
    where: { id },
    data: {
      ...(data.clientName !== undefined ? { clientName: data.clientName } : {}),
      ...(data.orderNumber !== undefined ? { orderNumber: data.orderNumber } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
      ...(data.expectedDelivery !== undefined ? { expectedDelivery } : {}),
      ...(data.codeIssued !== undefined ? { codeIssued: data.codeIssued } : {}),
    },
  });

  return NextResponse.json(updated);
}
