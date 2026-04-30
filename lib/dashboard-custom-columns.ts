import type { CustomFieldType, DashboardKind, Prisma } from "@prisma/client";

import type { AppRole } from "@/lib/constants";
import { formatDateRu } from "@/lib/i18n";

export const CUSTOM_FIELD_TYPES: CustomFieldType[] = ["TEXT", "NUMBER", "DATE", "BOOLEAN"];

/** Подписи типов полей для UI */
export const CUSTOM_FIELD_TYPE_LABELS_RU: Record<CustomFieldType, string> = {
  TEXT: "Текст",
  NUMBER: "Число",
  DATE: "Дата",
  BOOLEAN: "Да/нет",
};

export function appRoleForDashboard(dashboard: DashboardKind): AppRole {
  const map: Record<DashboardKind, AppRole> = {
    ACCOUNTING: "ACCOUNTING",
    LEGAL: "LEGAL",
    LOGISTICS: "LOGISTICS",
    CLIENT_SERVICE: "CLIENT_SERVICE",
  };
  return map[dashboard];
}

export function slugifyColumnKey(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-zа-яёәіңғүұқөһ0-9_-]+/gi, "")
    .slice(0, 48);
  return base || "pole";
}

export function customFieldsAsRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function formatCustomFieldCell(raw: unknown, fieldType: CustomFieldType): string {
  if (raw === null || raw === undefined || raw === "") return "—";
  switch (fieldType) {
    case "TEXT":
      return String(raw);
    case "NUMBER": {
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? String(n) : "—";
    }
    case "BOOLEAN":
      if (typeof raw === "boolean") return raw ? "Да" : "Нет";
      if (raw === "true" || raw === true) return "Да";
      if (raw === "false" || raw === false) return "Нет";
      return "—";
    case "DATE": {
      const s = String(raw);
      const d = new Date(s.length === 10 ? `${s}T12:00:00` : s);
      if (Number.isNaN(d.getTime())) return s;
      return formatDateRu(d);
    }
    default:
      return String(raw);
  }
}

export function normalizeCustomFieldInput(
  raw: unknown,
  fieldType: CustomFieldType,
): string | number | boolean | null {
  switch (fieldType) {
    case "TEXT": {
      if (raw === null || raw === undefined) return null;
      const s = String(raw).trim();
      return s.length ? s : null;
    }
    case "NUMBER": {
      if (raw === null || raw === undefined || raw === "") return null;
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
    case "BOOLEAN":
      if (raw === true || raw === "true" || raw === 1 || raw === "1") return true;
      if (raw === false || raw === "false" || raw === 0 || raw === "0") return false;
      return null;
    case "DATE": {
      if (raw === null || raw === undefined || raw === "") return null;
      const s = String(raw).slice(0, 10);
      const d = new Date(`${s}T12:00:00`);
      return Number.isNaN(d.getTime()) ? null : s;
    }
    default:
      return raw === null || raw === undefined ? null : String(raw);
  }
}
