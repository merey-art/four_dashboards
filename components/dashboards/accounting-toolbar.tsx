"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExcelImportHint } from "@/components/excel-import-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AccountingDialogs() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [counterpartName, setCounterpartName] = useState("");
  const [party, setParty] = useState<"SUPPLIER" | "CLIENT">("SUPPLIER");
  const [actKind, setActKind] = useState<"RECONCILIATION" | "ORIGINAL_ACT">("RECONCILIATION");
  const [actDate, setActDate] = useState("");
  const [originalReceived, setOriginalReceived] = useState(false);

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/accounting/acts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counterpartName,
        party,
        actKind,
        actDate: actDate || undefined,
        originalReceived,
      }),
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

  return (
    <div className="flex flex-wrap items-end gap-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button">Добавить запись</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый акт</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="ac-name">Контрагент</Label>
              <Input id="ac-name" value={counterpartName} onChange={(e) => setCounterpartName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Сторона</Label>
              <Select
                value={party}
                onValueChange={(v) => {
                  if (!v) return;
                  setParty(v as "SUPPLIER" | "CLIENT");
                }}
              >
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
              <Select
                value={actKind}
                onValueChange={(v) => {
                  if (!v) return;
                  setActKind(v as "RECONCILIATION" | "ORIGINAL_ACT");
                }}
              >
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
              <input type="checkbox" checked={originalReceived} onChange={(e) => setOriginalReceived(e.target.checked)} />{" "}
              Оригинал получен
            </label>
            <div className="grid gap-1">
              <Label htmlFor="ac-date">Дата акта</Label>
              <Input id="ac-date" type="date" value={actDate} onChange={(e) => setActDate(e.target.value)} />
            </div>
            {err ? <p className="text-sm text-destructive">{err}</p> : null}
          </div>
          <DialogFooter showCloseButton={false}>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ExcelImportHint endpoint="/api/accounting/import" title="Импорт Excel (.xlsx)" />
      <div className="max-w-md text-xs text-muted-foreground">
        Импорт: A — имя контрагента; B — SUPPLIER / CLIENT; C — «сверка» или «оригинал»; D — дата акта; E — оригинал
        получен (да/нет).
      </div>
    </div>
  );
}
