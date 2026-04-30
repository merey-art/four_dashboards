import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const party = ["CLIENT", "SUPPLIER"] as const;
const phase = ["SIGNING", "COMPLETED"] as const;

const patchSchema = z
  .object({
    counterparty: z.string().min(1).optional(),
    partyType: z.enum(party).optional(),
    phase: z.enum(phase).optional(),
    originalReceived: z.boolean().optional(),
    contractDate: z.string().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Нет полей для обновления" });

type Ctx = { params: { id: string } };

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["LEGAL"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = ctx.params;
  const existing = await prisma.legalContract.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Запись не найдена" }, { status: 404 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные" }, { status: 400 });
  }

  const data = parsed.data;
  let contractDate: Date | null | undefined;
  if (data.contractDate !== undefined) {
    if (data.contractDate === null || data.contractDate === "") {
      contractDate = null;
    } else {
      const d = new Date(data.contractDate);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ message: "Некорректная дата договора" }, { status: 400 });
      }
      contractDate = d;
    }
  }

  const updated = await prisma.legalContract.update({
    where: { id },
    data: {
      ...(data.counterparty !== undefined ? { counterparty: data.counterparty } : {}),
      ...(data.partyType !== undefined ? { partyType: data.partyType } : {}),
      ...(data.phase !== undefined ? { phase: data.phase } : {}),
      ...(data.originalReceived !== undefined ? { originalReceived: data.originalReceived } : {}),
      ...(data.contractDate !== undefined ? { contractDate } : {}),
    },
  });

  return NextResponse.json(updated);
}
