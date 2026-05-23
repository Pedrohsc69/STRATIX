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
    <section className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
      <header className="flex items-start justify-between gap-4 p-6 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#1F2937]">{title}</h2>
          {subtitle && <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>}
        </div>
        {action}
      </header>
      <div className="px-6 pb-6">{children}</div>
    </section>
  );
}
