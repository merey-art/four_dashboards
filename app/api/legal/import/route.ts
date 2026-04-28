import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  return s === "да" || s === "yes" || s === "true" || s === "1";
}

/** Excel-серийные даты */
function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["LEGAL"])) {
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
    const counterparty = String(r[0] ?? "").trim();
    const partyType = String(r[1] ?? "")
      .trim()
      .toUpperCase();
    const phaseRaw = String(r[2] ?? "").trim().toUpperCase();
    const originalReceived = parseBool(r[3]);
    const dateRaw = r[4];

    if (!counterparty || (partyType !== "CLIENT" && partyType !== "SUPPLIER")) {
      errors.push(`Строка ${i + 1}: контрагент и тип (CLIENT или SUPPLIER)`);
      continue;
    }

    const phase =
      phaseRaw.includes("ПОДПИС") || phaseRaw === "SIGNING" ? "SIGNING" : phaseRaw.includes("ЗАВЕРШ") ? "COMPLETED" : "";

    if (phase !== "SIGNING" && phase !== "COMPLETED") {
      errors.push(`Строка ${i + 1}: этап должен содержать «подписан» или «заверш» / SIGNING / COMPLETED`);
      continue;
    }

    let contractDate: Date | undefined;
    if (typeof dateRaw === "number" && Number.isFinite(dateRaw)) {
      contractDate = excelSerialToDate(dateRaw);
    } else if (dateRaw !== "" && dateRaw !== null && dateRaw !== undefined) {
      const d = new Date(String(dateRaw));
      if (!Number.isNaN(d.getTime())) contractDate = d;
    }

    await prisma.legalContract.create({
      data: {
        counterparty,
        partyType,
        phase,
        originalReceived,
        contractDate,
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
