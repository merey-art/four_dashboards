"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ChevronDown } from "lucide-react";

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomFieldType, DashboardKind } from "@prisma/client";

import { CUSTOM_FIELD_TYPES, CUSTOM_FIELD_TYPE_LABELS_RU } from "@/lib/dashboard-custom-columns";
import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";

type BuiltinItem = {
  key: string;
  defaultLabel: string;
  currentLabel: string;
  fieldType: CustomFieldType;
};

export function BuiltinColumnLabelsEditor({
  dashboard,
  initialBuiltinItems,
  initialCustomColumns,
}: {
  dashboard: DashboardKind;
  initialBuiltinItems: BuiltinItem[];
  initialCustomColumns: CustomColumnView[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // --- builtin label state ---
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialBuiltinItems.map((i) => [i.key, i.currentLabel])),
  );
  const [builtinBusy, setBuiltinBusy] = useState<string | null>(null);

  useEffect(() => {
    setValues(Object.fromEntries(initialBuiltinItems.map((i) => [i.key, i.currentLabel])));
  }, [initialBuiltinItems]);

  // --- custom columns state ---
  const [customColumns, setCustomColumns] = useState(initialCustomColumns);
  const [customEdits, setCustomEdits] = useState<Record<string, { label: string; fieldType: CustomFieldType }>>(() =>
    Object.fromEntries(initialCustomColumns.map((c) => [c.id, { label: c.label, fieldType: c.fieldType }])),
  );
  const [customBusy, setCustomBusy] = useState<string | null>(null);

  useEffect(() => {
    setCustomColumns(initialCustomColumns);
    setCustomEdits(
      Object.fromEntries(initialCustomColumns.map((c) => [c.id, { label: c.label, fieldType: c.fieldType }])),
    );
  }, [initialCustomColumns]);

  // --- add dialog state ---
  const [openAdd, setOpenAdd] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addFieldType, setAddFieldType] = useState<CustomFieldType>("TEXT");
  const [addErr, setAddErr] = useState<string | null>(null);
  const [addBusy, setAddBusy] = useState(false);

  async function refreshCustomFromApi() {
    const res = await fetch(`/api/dashboard/columns?dashboard=${dashboard}`);
    const data = (await res.json()) as CustomColumnView[] | { message?: string };
    if (res.ok && Array.isArray(data)) {
      setCustomColumns(data);
      setCustomEdits(Object.fromEntries(data.map((c) => [c.id, { label: c.label, fieldType: c.fieldType }])));
    }
    router.refresh();
  }

  // --- builtin handlers ---
  async function saveBuiltinKey(fieldKey: string) {
    setBuiltinBusy(fieldKey);
    const label = (values[fieldKey] ?? "").trim();
    const res = await fetch("/api/dashboard/builtin-column-labels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard, fieldKey, label: label.length ? label : null }),
    });
    setBuiltinBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      alert(data.message ?? "Не удалось сохранить");
      return;
    }
    router.refresh();
  }

  async function resetBuiltinKey(fieldKey: string, defaultLabel: string) {
    setValues((s) => ({ ...s, [fieldKey]: defaultLabel }));
    setBuiltinBusy(fieldKey);
    const res = await fetch("/api/dashboard/builtin-column-labels", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard, fieldKey, label: null }),
    });
    setBuiltinBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      alert(data.message ?? "Не удалось сбросить");
      return;
    }
    router.refresh();
  }

  // --- custom handlers ---
  async function saveCustomColumn(id: string) {
    const edit = customEdits[id];
    if (!edit) return;
    setCustomBusy(id);
    const res = await fetch(`/api/dashboard/columns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: edit.label, fieldType: edit.fieldType }),
    });
    setCustomBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      alert(data.message ?? "Не удалось сохранить");
      return;
    }
    await refreshCustomFromApi();
  }

  async function removeCustomColumn(id: string) {
    if (!confirm("Удалить столбец? Значения в строках для этого поля останутся в данных, но колонка скроется.")) {
      return;
    }
    setCustomBusy(id);
    const res = await fetch(`/api/dashboard/columns/${id}`, { method: "DELETE" });
    setCustomBusy(null);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      alert(data.message ?? "Не удалось удалить");
      return;
    }
    await refreshCustomFromApi();
  }

  async function createColumn() {
    setAddBusy(true);
    setAddErr(null);
    const res = await fetch("/api/dashboard/columns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboard, label: addLabel, fieldType: addFieldType }),
    });
    const data = (await res.json()) as { message?: string };
    setAddBusy(false);
    if (!res.ok) {
      setAddErr(data.message ?? "Не удалось создать столбец");
      return;
    }
    setOpenAdd(false);
    setAddLabel("");
    setAddFieldType("TEXT");
    await refreshCustomFromApi();
  }

  return (
    <div className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold">Подписи стандартных колонок</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      <div
        ref={bodyRef}
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: isOpen ? (bodyRef.current?.scrollHeight ?? 9999) : 0 }}
      >
        <div className="flex flex-col gap-3 border-t px-4 pb-4 pt-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <p className="text-xs text-muted-foreground">
              Текст в шапке таблицы для встроенных полей. «Сброс» возвращает исходную подпись.{" "}
              <span className="font-medium text-foreground">Первые колонки в таблице ниже</span> — стандартные поля
              страницы, они всегда на месте. Здесь вы добавляете{" "}
              <span className="font-medium text-foreground">ещё столбцы</span>: они появляются в той же таблице{" "}
              <span className="font-medium text-foreground">справа от стандартных</span>.
            </p>
            <Dialog
          open={openAdd}
          onOpenChange={(v) => {
            setOpenAdd(v);
            if (v) {
              setAddLabel("");
              setAddFieldType("TEXT");
              setAddErr(null);
            }
          }}
        >
          <DialogTrigger render={<Button type="button" size="sm" variant="default" className="shrink-0" />}>
            Добавить столбец
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый столбец</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label htmlFor="col-add-label">Название</Label>
                <Input
                  id="col-add-label"
                  value={addLabel}
                  onChange={(e) => setAddLabel(e.target.value)}
                  placeholder="Например: Примечание"
                />
              </div>
              <div className="grid gap-2">
                <Label>Тип поля</Label>
                <Select
                  value={addFieldType}
                  onValueChange={(v) => {
                    if (v) setAddFieldType(v as CustomFieldType);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOM_FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {CUSTOM_FIELD_TYPE_LABELS_RU[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {addErr ? <p className="text-sm text-destructive">{addErr}</p> : null}
            </div>
            <DialogFooter showCloseButton={false}>
              <Button type="button" variant="outline" onClick={() => setOpenAdd(false)}>
                Отмена
              </Button>
              <Button type="button" disabled={addBusy || !addLabel.trim()} onClick={() => void createColumn()}>
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Столбец (системное поле)</TableHead>
              <TableHead className="w-[140px]">Тип поля</TableHead>
              <TableHead>Подпись в таблице</TableHead>
              <TableHead className="w-[1%] text-right whitespace-nowrap">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialBuiltinItems.map((item) => (
              <TableRow key={item.key} className="hover:bg-muted/40">
                <TableCell className="align-top">
                  <code className="text-xs text-muted-foreground">{item.key}</code>
                  <div className="text-xs text-muted-foreground">По умолчанию: {item.defaultLabel}</div>
                </TableCell>
                <TableCell className="align-top">
                  <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                    {CUSTOM_FIELD_TYPE_LABELS_RU[item.fieldType]}
                  </span>
                </TableCell>
                <TableCell className="align-top">
                  <Input
                    value={values[item.key] ?? ""}
                    onChange={(e) => setValues((s) => ({ ...s, [item.key]: e.target.value }))}
                    placeholder={item.defaultLabel}
                  />
                </TableCell>
                <TableCell className="align-top text-right">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={builtinBusy === item.key}
                      onClick={() => void saveBuiltinKey(item.key)}
                    >
                      Сохранить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={builtinBusy === item.key}
                      onClick={() => void resetBuiltinKey(item.key, item.defaultLabel)}
                    >
                      Сброс
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {customColumns.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={4}
                  className="border-t py-5 text-center text-sm text-muted-foreground"
                >
                  Нажмите «Добавить столбец», чтобы создать дополнительные поля — они появятся в таблице справа.
                </TableCell>
              </TableRow>
            ) : (
              customColumns.map((c) => {
                const edit = customEdits[c.id] ?? { label: c.label, fieldType: c.fieldType };
                const isBusy = customBusy === c.id;
                return (
                  <TableRow key={c.id} className="hover:bg-muted/40 border-t">
                    <TableCell className="align-top">
                      <code className="text-xs text-muted-foreground">{c.key}</code>
                    </TableCell>
                    <TableCell className="align-top">
                      <Select
                        value={edit.fieldType}
                        onValueChange={(v) => {
                          if (v)
                            setCustomEdits((s) => ({
                              ...s,
                              [c.id]: { ...edit, fieldType: v as CustomFieldType },
                            }));
                        }}
                        disabled={isBusy}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CUSTOM_FIELD_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {CUSTOM_FIELD_TYPE_LABELS_RU[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="align-top">
                      <Input
                        value={edit.label}
                        onChange={(e) =>
                          setCustomEdits((s) => ({ ...s, [c.id]: { ...edit, label: e.target.value } }))
                        }
                        disabled={isBusy}
                      />
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <div className="flex flex-col gap-1 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isBusy || !edit.label.trim()}
                          onClick={() => void saveCustomColumn(c.id)}
                        >
                          Сохранить
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isBusy}
                          onClick={() => void removeCustomColumn(c.id)}
                        >
                          Удалить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
        </div>
      </div>
    </div>
  );
}
