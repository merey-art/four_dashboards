"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExcelImportHint } from "@/components/excel-import-hint";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ruLogisticsStatus } from "@/lib/i18n";

type StatusKey = keyof typeof ruLogisticsStatus;

const statuses: StatusKey[] = ["ON_GROUND_BORDER", "IN_TRANSIT_BORDER", "SHIPPED", "NOT_DEPARTED"];

export function LogisticsDialogs() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [containerNumber, setContainerNumber] = useState("");
  const [borderCrossing, setBorderCrossing] = useState("");
  const [routeNote, setRouteNote] = useState("");
  const [status, setStatus] = useState<StatusKey>("ON_GROUND_BORDER");

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/logistics/containers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        containerNumber,
        borderCrossing,
        routeNote: routeNote || undefined,
        status,
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
            <DialogTitle>Новое перемещение / контейнер</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1">
              <Label htmlFor="lg-cont">Номер контейнера</Label>
              <Input id="lg-cont" value={containerNumber} onChange={(e) => setContainerNumber(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="lg-border">Пункт пересечения границы</Label>
              <Input id="lg-border" value={borderCrossing} onChange={(e) => setBorderCrossing(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="lg-note">Комментарий по маршруту</Label>
              <Input id="lg-note" value={routeNote} onChange={(e) => setRouteNote(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Статус</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (!v) return;
                  setStatus(v as StatusKey);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите статус" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {ruLogisticsStatus[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
      <ExcelImportHint endpoint="/api/logistics/import" title="Импорт Excel (.xlsx)" />
      <div className="max-w-md text-xs text-muted-foreground">
        Импорт: A — контейнер, B — стык, C — статус (ON_GROUND_BORDER / IN_TRANSIT_BORDER / SHIPPED / NOT_DEPARTED), D —
        комментарий.
      </div>
    </div>
  );
}

export function LogisticsBorderFilter({ borders }: { borders: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [value, setValue] = useState(sp.get("border") ?? "");

  function apply() {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set("border", value);
    else p.delete("border");
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4">
      <div className="grid gap-2">
        <Label>Пограничный стык</Label>
        <Select
          value={value || "__all"}
          onValueChange={(v) => {
            if (v === null || v === undefined) return;
            setValue(v === "__all" ? "" : v);
          }}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Все стыки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">Все стыки</SelectItem>
            {borders.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={apply}>
        Применить
      </Button>
    </div>
  );
}
