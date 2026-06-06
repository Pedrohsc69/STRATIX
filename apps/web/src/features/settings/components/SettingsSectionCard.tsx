import type { PropsWithChildren, ReactNode } from "react";
import { DashboardCard } from "../../dashboard/components/DashboardCard";

type SettingsSectionCardProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  action?: ReactNode;
}>;

export function SettingsSectionCard({
  title,
  subtitle,
  action,
  children,
}: SettingsSectionCardProps) {
  return (
    <DashboardCard title={title} subtitle={subtitle} action={action}>
      {children}
    </DashboardCard>
  );
}
