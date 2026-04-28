"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExcelImportHint } from "@/components/excel-import-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClientServiceDialogs() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [clientName, setClientName] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [codeIssued, setCodeIssued] = useState(false);

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/clients-service/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName,
        orderNumber,
        quantity: Number(quantity),
        expectedDelivery,
        codeIssued,
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
    <div className="flex flex-wrap items-end gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button">Добавить запись</Button>} />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый заказ</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="cs-client">Клиент</Label>
              <Input id="cs-client" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="cs-ord">Номер заказа</Label>
              <Input id="cs-ord" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="cs-qty">Количество (конт.)</Label>
              <Input id="cs-qty" type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="cs-date">Ожидаемая дата поставки</Label>
              <Input id="cs-date" type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={codeIssued} onChange={(e) => setCodeIssued(e.target.checked)} /> Код выдан
            </label>
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
      <ExcelImportHint endpoint="/api/clients-service/import" title="Импорт Excel (.xlsx)" />
      <div className="text-xs text-muted-foreground md:max-w-md">
        Импорт: колонки A–E — клиент • номер • количество • дата • код выдан (да/нет).
      </div>
    </div>
  );
}
