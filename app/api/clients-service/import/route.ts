import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

/** Excel-серийные даты · приблизительно по UTC */
function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function parseBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "")
    .trim()
    .toLowerCase();
  return s === "да" || s === "yes" || s === "true" || s === "1" || s === "выдан";
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["CLIENT_SERVICE"])) {
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

  if (rows.length < 2) {
    return NextResponse.json({ message: "Файл пустой или только заголовок" }, { status: 400 });
  }

  let inserted = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every((c) => c === "" || c === null || c === undefined)) continue;
    const clientName = String(r[0] ?? "").trim();
    const orderNumber = String(r[1] ?? "").trim();
    const quantity = Number(r[2]);
    const dateRaw = r[3];
    const codeRaw = r[4];

    if (!clientName || !orderNumber || !Number.isFinite(quantity)) {
      errors.push(`Строка ${i + 1}: заполните клиента, номер и количество`);
      continue;
    }

    let expected: Date;
    if (typeof dateRaw === "number" && Number.isFinite(dateRaw)) {
      expected = excelSerialToDate(dateRaw);
    } else {
      const s = String(dateRaw ?? "").trim();
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) {
        errors.push(`Строка ${i + 1}: некорректная дата`);
        continue;
      }
      expected = d;
    }

    await prisma.clientServiceOrder.create({
      data: {
        clientName,
        orderNumber,
        quantity: Math.floor(quantity),
        expectedDelivery: expected,
        codeIssued: parseBool(codeRaw),
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
