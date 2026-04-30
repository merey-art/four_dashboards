"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PencilIcon } from "lucide-react";
import type { CustomFieldType, DashboardKind, Prisma } from "@prisma/client";

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

import { customFieldsAsRecord } from "@/lib/dashboard-custom-columns";

import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT: "Текст",
  NUMBER: "Число",
  DATE: "Дата",
  BOOLEAN: "Да/нет",
};

export function RowCustomFieldsButton({
  dashboard,
  rowId,
  columns,
  customFields,
}: {
  dashboard: DashboardKind;
  rowId: string;
  columns: CustomColumnView[];
  customFields: Prisma.JsonValue;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || columns.length === 0) return;
    const raw = customFieldsAsRecord(customFields);
    const next: Record<string, string> = {};
    for (const c of columns) {
      const v = raw[c.key];
      if (v === null || v === undefined) {
        next[c.key] = "";
        continue;
      }
      if (c.fieldType === "DATE" && typeof v === "string") {
        next[c.key] = v.slice(0, 10);
        continue;
      }
      if (c.fieldType === "BOOLEAN") {
        next[c.key] = v === true || v === "true" ? "true" : "false";
        continue;
      }
      next[c.key] = String(v);
    }
    setValues(next);
    setErr(null);
  }, [open, columns, customFields]);

  async function save() {
    setBusy(true);
    setErr(null);
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

    const res = await fetch("/api/dashboard/row-custom-fields", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard, rowId, fields }),
    });
    const data = (await res.json()) as { message?: string };
    setBusy(false);
    if (!res.ok) {
      setErr(data.message ?? "Не удалось сохранить");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  if (columns.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Дополнительные поля">
            <PencilIcon className="h-4 w-4" />
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Дополнительные поля</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {columns.map((c) => (
            <div key={c.key} className="grid gap-1">
              <Label htmlFor={`cf-${c.key}`}>
                {c.label}{" "}
                <span className="font-normal text-muted-foreground">({FIELD_TYPE_LABELS[c.fieldType]})</span>
              </Label>
              {c.fieldType === "TEXT" ? (
                <Input
                  id={`cf-${c.key}`}
                  value={values[c.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [c.key]: e.target.value }))}
                />
              ) : null}
              {c.fieldType === "NUMBER" ? (
                <Input
                  id={`cf-${c.key}`}
                  type="number"
                  value={values[c.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [c.key]: e.target.value }))}
                />
              ) : null}
              {c.fieldType === "DATE" ? (
                <Input
                  id={`cf-${c.key}`}
                  type="date"
                  value={values[c.key] ?? ""}
                  onChange={(e) => setValues((s) => ({ ...s, [c.key]: e.target.value }))}
                />
              ) : null}
              {c.fieldType === "BOOLEAN" ? (
                <Select
                  value={values[c.key] === "true" ? "true" : "false"}
                  onValueChange={(v) => {
                    if (v) setValues((s) => ({ ...s, [c.key]: v }));
                  }}
                >
                  <SelectTrigger id={`cf-${c.key}`}>
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
