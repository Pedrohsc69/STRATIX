import { LayoutDashboard } from "lucide-react";

type EmptyDashboardStateProps = {
  title?: string;
  description?: string;
};

export function EmptyDashboardState({
  title = "Nada para exibir ainda",
  description = "Assim que houver dados estratégicos disponíveis, a dashboard será atualizada.",
}: EmptyDashboardStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-card p-12 text-center text-card-foreground shadow-sm dark:border-slate-700">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EFF6FF]">
        <LayoutDashboard className="w-8 h-8 text-[#1E4E79]" />
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">{title}</h2>
      <p className="mx-auto max-w-lg text-muted-foreground">{description}</p>
    </div>
  );
}
