"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";
import { customFieldsAsRecord, CUSTOM_FIELD_TYPE_LABELS_RU } from "@/lib/dashboard-custom-columns";
import { ruLogisticsStatus } from "@/lib/i18n";

function dateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  try {
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function buildCustomFieldsPayload(
  columns: CustomColumnView[],
  values: Record<string, string>,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const c of columns) {
    const raw = values[c.key];
    if (c.fieldType === "BOOLEAN") {
      fields[c.key] = raw === "true";
      continue;
    }
    if (raw === "" || raw === undefined) {
      fields[c.key] = null;
      continue;
    }
    fields[c.key] = raw;
  }
  return fields;
}

export type EditDashboardRowAccountingProps = {
  dashboard: "ACCOUNTING";
  rowId: string;
  labels: Record<string, string>;
  row: {
    counterpartName: string;
    party: string;
    actKind: string;
    actDate: Date | null;
    originalReceived: boolean;
  };
  customColumns: CustomColumnView[];
  customFields: Prisma.JsonValue;
};

export type EditDashboardRowLegalProps = {
  dashboard: "LEGAL";
  rowId: string;
  labels: Record<string, string>;
  row: {
    counterparty: string;
    partyType: string;
    phase: string;
    originalReceived: boolean;
    contractDate: Date | null;
  };
  customColumns: CustomColumnView[];
  customFields: Prisma.JsonValue;
};

export type EditDashboardRowLogisticsProps = {
  dashboard: "LOGISTICS";
  rowId: string;
  labels: Record<string, string>;
  row: {
    containerNumber: string;
    borderCrossing: string;
    routeNote: string | null;
    status: string;
  };
  customColumns: CustomColumnView[];
  customFields: Prisma.JsonValue;
};

export type EditDashboardRowClientServiceProps = {
  dashboard: "CLIENT_SERVICE";
  rowId: string;
  labels: Record<string, string>;
  row: {
    clientName: string;
    orderNumber: string;
    quantity: number;
    expectedDelivery: Date;
    codeIssued: boolean;
  };
  customColumns: CustomColumnView[];
  customFields: Prisma.JsonValue;
};

export type EditDashboardRowButtonProps =
  | EditDashboardRowAccountingProps
  | EditDashboardRowLegalProps
  | EditDashboardRowLogisticsProps
  | EditDashboardRowClientServiceProps;

export function EditDashboardRowButton(props: EditDashboardRowButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const [acc, setAcc] = useState<EditDashboardRowAccountingProps["row"] | null>(null);
  const [leg, setLeg] = useState<EditDashboardRowLegalProps["row"] | null>(null);
  const [log, setLog] = useState<EditDashboardRowLogisticsProps["row"] | null>(null);
  const [cs, setCs] = useState<EditDashboardRowClientServiceProps["row"] | null>(null);

  const { dashboard, rowId, customColumns, customFields } = props;

  useEffect(() => {
    if (!open) return;
    if (props.dashboard === "ACCOUNTING") setAcc({ ...props.row });
    if (props.dashboard === "LEGAL") setLeg({ ...props.row });
    if (props.dashboard === "LOGISTICS") setLog({ ...props.row });
    if (props.dashboard === "CLIENT_SERVICE") setCs({ ...props.row });

    const raw = customFieldsAsRecord(customFields);
    const next: Record<string, string> = {};
    for (const c of customColumns) {
      const v = raw[c.key];
      if (v === null || v === undefined) next[c.key] = "";
      else if (c.fieldType === "DATE" && typeof v === "string") next[c.key] = v.slice(0, 10);
      else if (c.fieldType === "BOOLEAN") next[c.key] = v === true || v === "true" ? "true" : "false";
      else next[c.key] = String(v);
    }
    setCustomValues(next);
    setErr(null);
  }, [open, props, customColumns, customFields]);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      let patchUrl = "";
      let body: Record<string, unknown> = {};

      if (dashboard === "ACCOUNTING" && acc) {
        patchUrl = `/api/accounting/acts/${rowId}`;
        body = {
          counterpartName: acc.counterpartName,
          party: acc.party,
          actKind: acc.actKind,
          actDate: acc.actDate ? dateInputValue(acc.actDate) : "",
          originalReceived: acc.originalReceived,
        };
      } else if (dashboard === "LEGAL" && leg) {
        patchUrl = `/api/legal/contracts/${rowId}`;
        body = {
          counterparty: leg.counterparty,
          partyType: leg.partyType,
          phase: leg.phase,
          originalReceived: leg.originalReceived,
          contractDate: leg.contractDate ? dateInputValue(leg.contractDate) : null,
        };
      } else if (dashboard === "LOGISTICS" && log) {
        patchUrl = `/api/logistics/containers/${rowId}`;
        body = {
          containerNumber: log.containerNumber,
          borderCrossing: log.borderCrossing,
          routeNote: log.routeNote?.trim() ? log.routeNote : null,
          status: log.status,
        };
      } else if (dashboard === "CLIENT_SERVICE" && cs) {
        patchUrl = `/api/clients-service/orders/${rowId}`;
        body = {
          clientName: cs.clientName,
          orderNumber: cs.orderNumber,
          quantity: cs.quantity,
          expectedDelivery: dateInputValue(cs.expectedDelivery),
          codeIssued: cs.codeIssued,
        };
      } else {
        setErr("Форма не готова");
        return;
      }

      const res = await fetch(patchUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        setErr(data.message ?? "Не удалось сохранить строку");
        return;
      }

      if (customColumns.length > 0) {
        const fields = buildCustomFieldsPayload(customColumns, customValues);
        const r2 = await fetch("/api/dashboard/row-custom-fields", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dashboard, rowId, fields }),
        });
        const d2 = (await r2.json()) as { message?: string };
        if (!r2.ok) {
          setErr(d2.message ?? "Основные поля сохранены; доп. поля — ошибка");
          return;
        }
      }

      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const logisticsStatuses = Object.keys(ruLogisticsStatus) as (keyof typeof ruLogisticsStatus)[];
  const { labels } = props;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Редактировать строку">
            <PencilIcon className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Редактировать строку</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {dashboard === "ACCOUNTING" && acc ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Основные поля</p>
              <div className="grid gap-1">
                <Label>{labels.counterpartName}</Label>
                <Input value={acc.counterpartName} onChange={(e) => setAcc((r) => r && { ...r, counterpartName: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Сторона</Label>
                <Select value={acc.party} onValueChange={(v) => v && setAcc((r) => r && { ...r, party: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">Поставщик</SelectItem>
                    <SelectItem value="CLIENT">Клиент</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Тип документа</Label>
                <Select value={acc.actKind} onValueChange={(v) => v && setAcc((r) => r && { ...r, actKind: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECONCILIATION">Акт сверки</SelectItem>
                    <SelectItem value="ORIGINAL_ACT">Оригинал акта</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={acc.originalReceived}
                  onChange={(e) => setAcc((r) => r && { ...r, originalReceived: e.target.checked })}
                />
                {labels.originalReceived}
              </label>
              <div className="grid gap-1">
                <Label>{labels.actDate}</Label>
                <Input
                  type="date"
                  value={dateInputValue(acc.actDate)}
                  onChange={(e) =>
                    setAcc((r) => r && { ...r, actDate: e.target.value ? new Date(`${e.target.value}T12:00:00`) : null })
                  }
                />
              </div>
            </div>
          ) : null}

          {dashboard === "LEGAL" && leg ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Основные поля</p>
              <div className="grid gap-1">
                <Label>{labels.counterparty}</Label>
                <Input value={leg.counterparty} onChange={(e) => setLeg((r) => r && { ...r, counterparty: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{labels.partyType}</Label>
                <Select value={leg.partyType} onValueChange={(v) => v && setLeg((r) => r && { ...r, partyType: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT">Клиент</SelectItem>
                    <SelectItem value="SUPPLIER">Поставщик</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{labels.phase}</Label>
                <Select value={leg.phase} onValueChange={(v) => v && setLeg((r) => r && { ...r, phase: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SIGNING">На подписании</SelectItem>
                    <SelectItem value="COMPLETED">Завершён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={leg.originalReceived}
                  onChange={(e) => setLeg((r) => r && { ...r, originalReceived: e.target.checked })}
                />
                {labels.originalReceived}
              </label>
              <div className="grid gap-1">
                <Label>{labels.contractDate}</Label>
                <Input
                  type="date"
                  value={dateInputValue(leg.contractDate)}
                  onChange={(e) =>
                    setLeg((r) => r && { ...r, contractDate: e.target.value ? new Date(`${e.target.value}T12:00:00`) : null })
                  }
                />
              </div>
            </div>
          ) : null}

          {dashboard === "LOGISTICS" && log ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Основные поля</p>
              <div className="grid gap-1">
                <Label>{labels.containerNumber}</Label>
                <Input
                  className="font-mono"
                  value={log.containerNumber}
                  onChange={(e) => setLog((r) => r && { ...r, containerNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>{labels.borderCrossing}</Label>
                <Input value={log.borderCrossing} onChange={(e) => setLog((r) => r && { ...r, borderCrossing: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>{labels.status}</Label>
                <Select value={log.status} onValueChange={(v) => v && setLog((r) => r && { ...r, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {logisticsStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ruLogisticsStatus[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1">
                <Label>{labels.routeNote}</Label>
                <Input value={log.routeNote ?? ""} onChange={(e) => setLog((r) => r && { ...r, routeNote: e.target.value })} />
              </div>
            </div>
          ) : null}

          {dashboard === "CLIENT_SERVICE" && cs ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Основные поля</p>
              <div className="grid gap-1">
                <Label>{labels.clientName}</Label>
                <Input value={cs.clientName} onChange={(e) => setCs((r) => r && { ...r, clientName: e.target.value })} />
              </div>
              <div className="grid gap-1">
                <Label>{labels.orderNumber}</Label>
                <Input
                  className="font-mono"
                  value={cs.orderNumber}
                  onChange={(e) => setCs((r) => r && { ...r, orderNumber: e.target.value })}
                />
              </div>
              <div className="grid gap-1">
                <Label>{labels.quantity}</Label>
                <Input
                  type="number"
                  min={1}
                  value={cs.quantity}
                  onChange={(e) => setCs((r) => r && { ...r, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
              </div>
              <div className="grid gap-1">
                <Label>{labels.expectedDelivery}</Label>
                <Input
                  type="date"
                  value={dateInputValue(cs.expectedDelivery)}
                  onChange={(e) =>
                    setCs((r) =>
                      r && e.target.value ? { ...r, expectedDelivery: new Date(`${e.target.value}T12:00:00`) } : r,
                    )
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cs.codeIssued}
                  onChange={(e) => setCs((r) => r && { ...r, codeIssued: e.target.checked })}
                />
                {labels.codeIssued}
              </label>
            </div>
          ) : null}

          {customColumns.length > 0 ? (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Дополнительные поля</p>
              {customColumns.map((c) => (
                <div key={c.key} className="grid gap-1">
                  <Label>
                    {c.label}{" "}
                    <span className="font-normal text-muted-foreground">({CUSTOM_FIELD_TYPE_LABELS_RU[c.fieldType]})</span>
                  </Label>
                  {c.fieldType === "TEXT" ? (
                    <Input value={customValues[c.key] ?? ""} onChange={(e) => setCustomValues((s) => ({ ...s, [c.key]: e.target.value }))} />
                  ) : null}
                  {c.fieldType === "NUMBER" ? (
                    <Input
                      type="number"
                      value={customValues[c.key] ?? ""}
                      onChange={(e) => setCustomValues((s) => ({ ...s, [c.key]: e.target.value }))}
                    />
                  ) : null}
                  {c.fieldType === "DATE" ? (
                    <Input
                      type="date"
                      value={customValues[c.key] ?? ""}
                      onChange={(e) => setCustomValues((s) => ({ ...s, [c.key]: e.target.value }))}
                    />
                  ) : null}
                  {c.fieldType === "BOOLEAN" ? (
                    <Select
                      value={customValues[c.key] === "true" ? "true" : "false"}
                      onValueChange={(v) => v && setCustomValues((s) => ({ ...s, [c.key]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="false">Нет</SelectItem>
                        <SelectItem value="true">Да</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {err ? <p className="text-sm text-destructive">{err}</p> : null}
        </div>
        <DialogFooter showCloseButton={false}>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button type="button" disabled={busy} onClick={() => void save()}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
