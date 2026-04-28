import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import * as XLSX from "xlsx";

import { authOptions } from "@/lib/auth";
import { hasApiAccess } from "@/lib/api-role";
import { prisma } from "@/lib/prisma";

const statuses = new Set(["ON_GROUND_BORDER", "IN_TRANSIT_BORDER", "SHIPPED", "NOT_DEPARTED"]);

function normStatus(v: unknown): string | null {
  const s = String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  const map: Record<string, string> = {
    NG: "NOT_DEPARTED",
    На_Земле: "ON_GROUND_BORDER",
  };
  if (statuses.has(s)) return s;
  if (map[s]) return map[s];
  return null;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasApiAccess(session.user.role, ["LOGISTICS"])) {
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
    const containerNumber = String(r[0] ?? "").trim();
    const borderCrossing = String(r[1] ?? "").trim();
    const statusRaw = String(r[2] ?? "").trim();
    const routeNote = String(r[3] ?? "").trim();

    const status = normStatus(statusRaw);
    if (!containerNumber || !borderCrossing || !status) {
      errors.push(
        `Строка ${i + 1}: укажите контейнер, стык (${borderCrossing || "?"}) и статус (${statusRaw || "?"}) как ON_GROUND_BORDER / …`,
      );
      continue;
    }

    await prisma.logisticsContainer.create({
      data: {
        containerNumber,
        borderCrossing,
        status,
        routeNote: routeNote || null,
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
