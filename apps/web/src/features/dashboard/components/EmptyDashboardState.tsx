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
    <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center shadow-sm">
      <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
        <LayoutDashboard className="w-8 h-8 text-[#1E4E79]" />
      </div>
      <h2 className="text-xl font-semibold text-[#1F2937] mb-2">{title}</h2>
      <p className="text-[#6B7280] max-w-lg mx-auto">{description}</p>
    </div>
  );
}
