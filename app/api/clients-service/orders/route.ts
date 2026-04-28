import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  clientName: z.string().min(1),
  orderNumber: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  expectedDelivery: z.string().min(1),
  codeIssued: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["CLIENT_SERVICE"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные формы" }, { status: 400 });
  }

  const d = new Date(parsed.data.expectedDelivery);
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ message: "Некорректная дата" }, { status: 400 });
  }

  const row = await prisma.clientServiceOrder.create({
    data: {
      clientName: parsed.data.clientName,
      orderNumber: parsed.data.orderNumber,
      quantity: parsed.data.quantity,
      expectedDelivery: d,
      codeIssued: parsed.data.codeIssued,
    },
  });

  return NextResponse.json(row);
}
