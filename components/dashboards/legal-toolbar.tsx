"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExcelImportHint } from "@/components/excel-import-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function LegalDialogs() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [counterparty, setCounterparty] = useState("");
  const [partyType, setPartyType] = useState<"CLIENT" | "SUPPLIER">("CLIENT");
  const [phase, setPhase] = useState<"SIGNING" | "COMPLETED">("SIGNING");
  const [originalReceived, setOriginalReceived] = useState(false);
  const [contractDate, setContractDate] = useState("");

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/legal/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        counterparty,
        partyType,
        phase,
        originalReceived,
        contractDate: contractDate || undefined,
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
            <DialogTitle>Новый договор</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="lg-cp">Контрагент</Label>
              <Input id="lg-cp" value={counterparty} onChange={(e) => setCounterparty(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Тип контрагента</Label>
              <Select
                value={partyType}
                onValueChange={(v) => {
                  if (!v) return;
                  setPartyType(v as "CLIENT" | "SUPPLIER");
                }}
              >
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
              <Label>Статус</Label>
              <Select
                value={phase}
                onValueChange={(v) => {
                  if (!v) return;
                  setPhase(v as "SIGNING" | "COMPLETED");
                }}
              >
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
              <input type="checkbox" checked={originalReceived} onChange={(e) => setOriginalReceived(e.target.checked)} />{" "}
              Оригинал получен
            </label>
            <div className="grid gap-1">
              <Label htmlFor="lg-cd">Дата договора</Label>
              <Input id="lg-cd" type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
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
      <ExcelImportHint endpoint="/api/legal/import" title="Импорт Excel (.xlsx)" />
      <div className="max-w-md text-xs text-muted-foreground">
        Импорт: A — контрагент; B — CLIENT / SUPPLIER; C — текст этапа («подписан» / «завершён»); D — оригинал получен
        (да/нет); E — дата договора.
      </div>
    </div>
  );
}
