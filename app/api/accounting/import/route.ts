import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  return s === "да" || s === "yes" || s === "true" || s === "1";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["ACCOUNTING"])) {
    return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ message: "Файл не найден" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];

  let inserted = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every((c) => c === "" || c === null || c === undefined)) continue;
    const counterpartName = String(r[0] ?? "").trim();
    const party = String(r[1] ?? "")
      .trim()
      .toUpperCase();
    const actKindRaw = String(r[2] ?? "").trim().toUpperCase();
    const actDateRaw = r[3];
    const originalReceived = parseBool(r[4]);

    if (!counterpartName || (party !== "SUPPLIER" && party !== "CLIENT")) {
      errors.push(`Строка ${i + 1}: имя контрагента и сторона SUPPLIER/CLIENT`);
      continue;
    }

    let actKind: "RECONCILIATION" | "ORIGINAL_ACT" | null = null;
    if (
      actKindRaw.includes("СВЕР") ||
      actKindRaw.includes("RECON") ||
      actKindRaw === "RECONCILIATION"
    ) {
      actKind = "RECONCILIATION";
    } else if (actKindRaw.includes("ОРИГИН") || actKindRaw.includes("ORIGINAL")) {
      actKind = "ORIGINAL_ACT";
    }

    if (!actKind) {
      errors.push(`Строка ${i + 1}: вид акта не распознан (сверка / оригинал)`);
      continue;
    }

    let actDate: Date | undefined;
    if (typeof actDateRaw === "number" && Number.isFinite(actDateRaw)) {
      actDate = excelSerialToDate(actDateRaw);
    } else if (actDateRaw !== "" && actDateRaw !== null && actDateRaw !== undefined) {
      const d = new Date(String(actDateRaw));
      if (!Number.isNaN(d.getTime())) actDate = d;
    }

    await prisma.accountingAct.create({
      data: {
        counterpartName,
        party,
        actKind,
        actDate,
        originalReceived,
      },
    });
    inserted++;
  }

  return NextResponse.json({
    inserted,
    errors,
    message:
      errors.length > 0
        ? `Импорт завершён с предупреждениями (${errors.length}).`
        : `Импортировано строк: ${inserted}.`,
  });
}
