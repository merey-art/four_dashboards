/** Русские подписи для значений статусов и перечислений в БД */
export const ruLogisticsStatus: Record<string, string> = {
  ON_GROUND_BORDER: "На земле по погран. стыкам",
  IN_TRANSIT_BORDER: "В ходу на погран. стыки",
  SHIPPED: "Отгружено",
  NOT_DEPARTED: "Не вышедшие",
};

export const ruLegalParty: Record<string, string> = {
  CLIENT: "Клиент",
  SUPPLIER: "Поставщик",
};

export const ruLegalPhase: Record<string, string> = {
  SIGNING: "На подписании",
  COMPLETED: "Завершён",
};

export const ruAccountingKind: Record<string, string> = {
  RECONCILIATION: "Сверка",
  ORIGINAL_ACT: "Акт (оригинал)",
};

export function formatDateRu(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("ru-RU").format(date);
}

export function badgeYesNo(ok: boolean): { label: string; variant: "success" | "destructive" } {
  return ok ? { label: "Да", variant: "success" } : { label: "Нет", variant: "destructive" };
}

export function badgeCode(ok: boolean): { label: string; variant: "success" | "warning" } {
  return ok ? { label: "Выдан", variant: "success" } : { label: "Не выдан", variant: "warning" };
}
