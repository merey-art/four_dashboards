"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DashboardDateFilter() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  useEffect(() => {
    setFrom(sp.get("from") ?? "");
    setTo(sp.get("to") ?? "");
  }, [sp]);

  function apply() {
    const p = new URLSearchParams(sp.toString());
    if (from) p.set("from", from);
    else p.delete("from");
    if (to) p.set("to", to);
    else p.delete("to");
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  function reset() {
    setFrom("");
    setTo("");
    router.push(pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border bg-card p-4">
      <div className="space-y-2">
        <Label htmlFor="df-from">Период с</Label>
        <Input id="df-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="df-to">По</Label>
        <Input id="df-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={apply}>
          Применить
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          Сбросить
        </Button>
      </div>
    </div>
  );
}
