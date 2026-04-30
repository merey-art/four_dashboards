import type { CustomFieldType, DashboardKind } from "@prisma/client";

/** Встроенные колонки таблицы на каждой странице (data-key в Prisma) */
export const BUILTIN_FIELDS_BY_DASHBOARD: Record<
  DashboardKind,
  readonly { key: string; defaultLabel: string; fieldType: CustomFieldType }[]
> = {
  ACCOUNTING: [
    { key: "counterpartName", defaultLabel: "Наименование", fieldType: "TEXT" },
    { key: "actDate", defaultLabel: "Дата акта", fieldType: "DATE" },
    { key: "originalReceived", defaultLabel: "Оригинал", fieldType: "BOOLEAN" },
  ],
  LEGAL: [
    { key: "counterparty", defaultLabel: "Контрагент", fieldType: "TEXT" },
    { key: "partyType", defaultLabel: "Тип", fieldType: "TEXT" },
    { key: "phase", defaultLabel: "Статус", fieldType: "TEXT" },
    { key: "originalReceived", defaultLabel: "Оригинал", fieldType: "BOOLEAN" },
    { key: "contractDate", defaultLabel: "Дата", fieldType: "DATE" },
  ],
  LOGISTICS: [
    { key: "containerNumber", defaultLabel: "Контейнер", fieldType: "TEXT" },
    { key: "borderCrossing", defaultLabel: "Погран. стык", fieldType: "TEXT" },
    { key: "status", defaultLabel: "Статус", fieldType: "TEXT" },
    { key: "routeNote", defaultLabel: "Комментарий", fieldType: "TEXT" },
  ],
  CLIENT_SERVICE: [
    { key: "clientName", defaultLabel: "Клиент", fieldType: "TEXT" },
    { key: "orderNumber", defaultLabel: "Номер заказа", fieldType: "TEXT" },
    { key: "quantity", defaultLabel: "Кол-во конт.", fieldType: "NUMBER" },
    { key: "expectedDelivery", defaultLabel: "Ожид. дата", fieldType: "DATE" },
    { key: "codeIssued", defaultLabel: "Статус кода", fieldType: "BOOLEAN" },
  ],
};

export function allowedBuiltinFieldKeys(dashboard: DashboardKind): Set<string> {
  return new Set(BUILTIN_FIELDS_BY_DASHBOARD[dashboard].map((f) => f.key));
}

export function defaultBuiltinLabel(dashboard: DashboardKind, fieldKey: string): string | undefined {
  return BUILTIN_FIELDS_BY_DASHBOARD[dashboard].find((f) => f.key === fieldKey)?.defaultLabel;
}

/** Слитые подписи: переопределение или дефолт */
export function mergedBuiltinLabels(
  dashboard: DashboardKind,
  overrides: { fieldKey: string; label: string }[],
): Record<string, string> {
  const ov = Object.fromEntries(overrides.map((o) => [o.fieldKey, o.label]));
  const out: Record<string, string> = {};
  for (const f of BUILTIN_FIELDS_BY_DASHBOARD[dashboard]) {
    out[f.key] = ov[f.key] ?? f.defaultLabel;
  }
  return out;
}

/** Для редактора: текущее и исходное название */
export function builtinLabelEditorItems(
  dashboard: DashboardKind,
  overrides: { fieldKey: string; label: string }[],
): { key: string; defaultLabel: string; currentLabel: string; fieldType: CustomFieldType }[] {
  const merged = mergedBuiltinLabels(dashboard, overrides);
  return BUILTIN_FIELDS_BY_DASHBOARD[dashboard].map((f) => ({
    key: f.key,
    defaultLabel: f.defaultLabel,
    currentLabel: merged[f.key],
    fieldType: f.fieldType,
  }));
}
