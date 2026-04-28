import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const party = ["CLIENT", "SUPPLIER"] as const;
const phase = ["SIGNING", "COMPLETED"] as const;

const bodySchema = z.object({
  counterparty: z.string().min(1),
  partyType: z.enum(party),
  phase: z.enum(phase),
  originalReceived: z.boolean(),
  contractDate: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["LEGAL"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Некорректные данные формы" }, { status: 400 });
  }

  let contractDate: Date | undefined;
  if (parsed.data.contractDate) {
    const d = new Date(parsed.data.contractDate);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ message: "Некорректная дата договора" }, { status: 400 });
    }
    contractDate = d;
  }

  const row = await prisma.legalContract.create({
    data: {
      counterparty: parsed.data.counterparty,
      partyType: parsed.data.partyType,
      phase: parsed.data.phase,
      originalReceived: parsed.data.originalReceived,
      contractDate,
    },
  });

  return NextResponse.json(row);
}
