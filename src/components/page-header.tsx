import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card p-5 md:p-7",
        className,
      )}
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {icon && (
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl gradient-primary text-white shadow-glow">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl md:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
