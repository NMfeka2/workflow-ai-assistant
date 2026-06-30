import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  delta,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "success" | "warning";
}) {
  const tones: Record<string, string> = {
    primary: "from-[oklch(0.55_0.21_263)] to-[oklch(0.4_0.18_295)]",
    accent: "from-[oklch(0.4_0.18_295)] to-[oklch(0.55_0.21_263)]",
    success: "from-[oklch(0.7_0.17_150)] to-[oklch(0.55_0.21_263)]",
    warning: "from-[oklch(0.78_0.16_75)] to-[oklch(0.4_0.18_295)]",
  };
  const tone = tones[accent ?? "primary"];

  return (
    <Card className="glass relative overflow-hidden p-4 transition-shadow hover:shadow-elegant">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 font-serif text-3xl">{value}</div>
          {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
        </div>
        {icon && (
          <div
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white",
              tone,
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
