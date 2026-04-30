"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TableHead } from "@/components/ui/table";
import type { CustomColumnView } from "@/components/dashboards/dashboard-column-manager";
import { CUSTOM_FIELD_TYPE_LABELS_RU } from "@/lib/dashboard-custom-columns";

export function CustomColumnTableHead({ column }: { column: CustomColumnView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        `Удалить столбец «${column.label}»? Колонка исчезнет из таблицы; сохранённые значения в строках останутся в данных.`,
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch(`/api/dashboard/columns/${column.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const data = (await res.json()) as { message?: string };
      alert(data.message ?? "Не удалось удалить столбец");
      return;
    }
    router.refresh();
  }

  return (
    <TableHead className="align-top">
      <div className="flex min-w-[9rem] max-w-[16rem] flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="leading-snug font-medium">{column.label}</span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="h-8 w-8 shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={busy}
            title="Удалить этот столбец"
            onClick={() => void handleDelete()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <span className="text-[11px] font-normal normal-case text-muted-foreground">
          {CUSTOM_FIELD_TYPE_LABELS_RU[column.fieldType]}
        </span>
      </div>
    </TableHead>
  );
}
