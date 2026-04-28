import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const statuses = ["ON_GROUND_BORDER", "IN_TRANSIT_BORDER", "SHIPPED", "NOT_DEPARTED"] as const;

const bodySchema = z.object({
  containerNumber: z.string().min(1),
  borderCrossing: z.string().min(1),
  routeNote: z.string().optional(),
  status: z.enum(statuses),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["LOGISTICS"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные формы" }, { status: 400 });
  }

  const row = await prisma.logisticsContainer.create({ data: parsed.data });
  return NextResponse.json(row);
}
