"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function uploadExcel(endpoint: string, fileList: FileList | null): Promise<Response> {
  const body = new FormData();
  if (!fileList?.[0]) throw new Error("Файл не выбран");
  body.append("file", fileList[0]);
  return fetch(endpoint, { method: "POST", body });
}

export function ExcelImportHint({ endpoint, title }: { endpoint: string; title: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      setBusy(true);
      setMsg(null);
      const res = await uploadExcel(endpoint, e.target.files);
      const data = (await res.json()) as { message?: string; errors?: string[] };
      if (!res.ok) {
        setMsg(data.message ?? "Ошибка импорта");
        return;
      }
      let m = data.message ?? "Готово";
      if (data.errors?.length) m += `\n${data.errors.slice(0, 5).join("; ")}`;
      setMsg(m);
      router.refresh();
    } catch (err: unknown) {
      setMsg(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm">{title}</Label>
      <Input type="file" accept=".xlsx,.xls" disabled={busy} onChange={(e) => void onChange(e)} />
      {msg ? <p className="whitespace-pre-wrap text-xs text-muted-foreground">{msg}</p> : null}
    </div>
  );
}
