import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const parties = ["SUPPLIER", "CLIENT"] as const;
const kinds = ["RECONCILIATION", "ORIGINAL_ACT"] as const;

const patchSchema = z
  .object({
    counterpartName: z.string().min(1).optional(),
    party: z.enum(parties).optional(),
    actKind: z.enum(kinds).optional(),
    actDate: z.string().nullable().optional(),
    originalReceived: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Нет полей для обновления" });

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["ACCOUNTING"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = ctx.params;
  const existing = await prisma.accountingAct.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Запись не найдена" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const data = parsed.data;
  let actDate: Date | null | undefined;
  if (data.actDate !== undefined) {
    if (data.actDate === null || data.actDate === "") {
      actDate = null;
    } else {
      const d = new Date(data.actDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ message: "Некорректная дата акта" }, { status: 400 });
      }
      actDate = d;
    }
  }

  const updated = await prisma.accountingAct.update({
    where: { id },
    data: {
      ...(data.counterpartName !== undefined ? { counterpartName: data.counterpartName } : {}),
      ...(data.party !== undefined ? { party: data.party } : {}),
      ...(data.actKind !== undefined ? { actKind: data.actKind } : {}),
      ...(data.actDate !== undefined ? { actDate } : {}),
      ...(data.originalReceived !== undefined ? { originalReceived: data.originalReceived } : {}),
    },
  });

  return NextResponse.json(updated);
}
