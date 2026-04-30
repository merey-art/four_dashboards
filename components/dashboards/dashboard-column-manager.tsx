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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CustomFieldType, DashboardKind } from "@prisma/client";

import { CUSTOM_FIELD_TYPES, CUSTOM_FIELD_TYPE_LABELS_RU } from "@/lib/dashboard-custom-columns";

export type CustomColumnView = {
  id: string;
  key: string;
  label: string;
  fieldType: CustomFieldType;
  sortOrder: number;
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
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Свои столбцы к таблице</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Первые колонки в таблице ниже</span> — стандартные поля
            страницы, они всегда на месте. Здесь вы добавляете{" "}
            <span className="font-medium text-foreground">ещё столбцы</span>: они появляются в той же таблице{" "}
            <span className="font-medium text-foreground">справа от стандартных</span>. Создайте столбец кнопкой справа;
            в списке — «Изменить» и «Удалить»; удалить можно и по корзине в шапке новой колонки.
          </p>
        </div>
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
          <DialogTrigger render={<Button type="button" size="sm" variant="default" className="shrink-0" />}>
            Добавить свой столбец
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
                        {CUSTOM_FIELD_TYPE_LABELS_RU[t]}
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Ваш столбец (название)</TableHead>
              <TableHead className="w-[25%]">Тип поля</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {columns.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-6 text-center text-sm leading-relaxed text-muted-foreground">
                  <span className="font-medium text-foreground">Своих дополнительных столбцов пока нет.</span>
                  <br />
                  Это не про стандартную шапку таблицы на странице — те колонки заданы системой и отсюда не настраиваются.
                  Нажмите «Добавить свой столбец» — новые поля появятся в таблице справа, а здесь — кнопки «Изменить» и
                  «Удалить».
                </TableCell>
              </TableRow>
            ) : (
              columns.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium">{c.label}</TableCell>
                  <TableCell className="text-muted-foreground">{CUSTOM_FIELD_TYPE_LABELS_RU[c.fieldType]}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setOpenEditId(c.id)}>
                        Изменить
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => void removeColumn(c.id)}
                      >
                        Удалить
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
                      {CUSTOM_FIELD_TYPE_LABELS_RU[t]}
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
