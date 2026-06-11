import type { PropsWithChildren, ReactNode } from "react";

type DashboardCardProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}>;

export function DashboardCard({
  title,
  subtitle,
  action,
  className = "",
  children,
}: DashboardCardProps) {
  return (
    <section className={`rounded-2xl border border-border bg-card text-card-foreground shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-4 p-6 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}
