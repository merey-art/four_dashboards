"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
import type { CustomFieldType, DashboardKind } from "@prisma/client";

import { CUSTOM_FIELD_TYPES } from "@/lib/dashboard-custom-columns";

export type CustomColumnView = {
  id: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
};

const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
  TEXT: "Текст",
  NUMBER: "Число",
  DATE: "Дата",
  BOOLEAN: "Да/нет",
};

export function DashboardColumnManager({
  dashboard,
  initialColumns,
}: {
  dashboard: DashboardKind;
  initialColumns: CustomColumnView[];
}) {
  const router = useRouter();
  const [columns, setColumns] = useState(initialColumns);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEditId, setOpenEditId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<CustomFieldType>("TEXT");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const editing = openEditId ? columns.find((c) => c.id === openEditId) : null;

  useEffect(() => {
    if (editing) {
      setLabel(editing.label);
      setFieldType(editing.fieldType);
      setErr(null);
    }
  }, [editing]);

  async function refreshFromApi() {
    const res = await fetch(`/api/dashboard/columns?dashboard=${dashboard}`);
    const data = (await res.json()) as CustomColumnView[] | { message?: string };
    if (res.ok && Array.isArray(data)) {
      setColumns(data);
    }
    router.refresh();
  }

  async function createColumn() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/dashboard/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard, label, fieldType }),
    });
    const data = (await res.json()) as { message?: string };
    setBusy(false);
    if (!res.ok) {
      setErr(data.message ?? "Не удалось создать столбец");
      return;
    }
    setOpenAdd(false);
    setLabel("");
    setFieldType("TEXT");
    await refreshFromApi();
  }

  async function saveEdit() {
    if (!openEditId) return;
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/dashboard/columns/${openEditId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, fieldType }),
    });
    const data = (await res.json()) as { message?: string };
    setBusy(false);
    if (!res.ok) {
      setErr(data.message ?? "Не удалось сохранить");
      return;
    }
    setOpenEditId(null);
    await refreshFromApi();
  }

  async function removeColumn(id: string) {
    if (!confirm("Удалить столбец? Значения в строках для этого поля останутся в данных, но колонка скроется.")) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/dashboard/columns/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      alert(data.message ?? "Не удалось удалить");
      return;
    }
    await refreshFromApi();
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Дополнительные столбцы</p>
        <Dialog
          open={openAdd}
          onOpenChange={(v) => {
            setOpenAdd(v);
            if (v) {
              setLabel("");
              setFieldType("TEXT");
              setErr(null);
            }
          }}
        >
          <DialogTrigger render={<Button type="button" size="sm" variant="secondary" />}>
            Добавить столбец
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый столбец</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label htmlFor="col-label">Название</Label>
                <Input id="col-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Например: Примечание" />
              </div>
              <div className="grid gap-2">
                <Label>Тип поля</Label>
                <Select
                  value={fieldType}
                  onValueChange={(v) => {
                    if (v) setFieldType(v as CustomFieldType);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {FIELD_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {err ? <p className="text-sm text-destructive">{err}</p> : null}
            </div>
            <DialogFooter showCloseButton={false}>
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                Отмена
              </Button>
              <Button type="button" disabled={busy || !label.trim()} onClick={() => void createColumn()}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {columns.length === 0 ? (
        <p className="text-xs text-muted-foreground">Пока нет пользовательских столбцов. Создайте первый — он появится в таблице.</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          {columns.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/30 px-2 py-1.5"
            >
              <span>
                <span className="font-medium">{c.label}</span>
                <span className="ml-2 text-muted-foreground">({FIELD_TYPE_LABELS[c.fieldType]})</span>
              </span>
              <span className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setOpenEditId(c.id)}>
                  Изменить
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => void removeColumn(c.id)}>
                  Удалить
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={!!openEditId}
        onOpenChange={(v) => {
          if (!v) setOpenEditId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Изменить столбец</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="col-label-edit">Название</Label>
              <Input id="col-label-edit" value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Тип поля</Label>
              <Select
                value={fieldType}
                onValueChange={(v) => {
                  if (v) setFieldType(v as CustomFieldType);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOM_FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {FIELD_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
          </div>
          <DialogFooter showCloseButton={false}>
            <Button type="button" variant="outline" onClick={() => setOpenEditId(null)}>
              Отмена
            </Button>
            <Button type="button" disabled={busy || !label.trim()} onClick={() => void saveEdit()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
