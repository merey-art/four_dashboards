import { endOfDay, isValid, startOfDay } from "date-fns";

export type ParsedRange = { from: Date | null; to: Date | null };

/** Парсинг ?from=&to= (YYYY-MM-DD) для фильтрации */
export function parseIsoDateRange(params: { from?: string; to?: string }): ParsedRange {
  let from: Date | null = null;
  let to: Date | null = null;

  if (params.from) {
    const d = new Date(`${params.from}T00:00:00`);
    if (isValid(d)) from = startOfDay(d);
  }
  if (params.to) {
    const d = new Date(`${params.to}T00:00:00`);
    if (isValid(d)) to = endOfDay(d);
  }
  return { from, to };
}

/** Условие Prisma по полю-дате (nullable границы) */
export function prismaDateRange(where: ParsedRange | undefined) {
  if (!where) return undefined;
  const f: { gte?: Date; lte?: Date } = {};
  if (where.from) f.gte = where.from;
  if (where.to) f.lte = where.to;
  if (!f.gte && !f.lte) return undefined;
  return f;
}
