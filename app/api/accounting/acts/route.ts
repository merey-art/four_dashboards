import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const parties = ["SUPPLIER", "CLIENT"] as const;
const kinds = ["RECONCILIATION", "ORIGINAL_ACT"] as const;

const bodySchema = z.object({
  counterpartName: z.string().min(1),
  party: z.enum(parties),
  actKind: z.enum(kinds),
  actDate: z.string().optional(),
  originalReceived: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["ACCOUNTING"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные формы" }, { status: 400 });
  }

  let actDate: Date | undefined;
  if (parsed.data.actDate) {
    const d = new Date(parsed.data.actDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ message: "Некорректная дата акта" }, { status: 400 });
    }
    actDate = d;
  }

  const row = await prisma.accountingAct.create({
    data: {
      counterpartName: parsed.data.counterpartName,
      party: parsed.data.party,
      actKind: parsed.data.actKind,
      actDate,
      originalReceived: parsed.data.originalReceived,
    },
  });

  return NextResponse.json(row);
}
