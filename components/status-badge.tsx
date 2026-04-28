import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "success" | "destructive" | "warning" | "muted";

const toneClass: Record<Tone, string> = {
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  destructive: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200",
  warning: "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  muted: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({
  children,
  tone = "muted",
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
