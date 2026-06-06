import { AlertTriangle } from "lucide-react";
import { SettingsSectionCard } from "./SettingsSectionCard";

type DangerZoneCardProps = {
  message: string | null;
};

export function DangerZoneCard({ message }: DangerZoneCardProps) {
  return (
    <SettingsSectionCard
      title="Zona de risco"
      subtitle="Ações destrutivas só aparecem quando houver suporte seguro no backend."
      action={<AlertTriangle className="h-5 w-5 text-[#D97706]" />}
    >
      <div className="rounded-xl border border-[#FED7AA] bg-[#FFF7ED] px-4 py-4">
        <p className="text-sm font-medium text-[#9A3412]">Indisponível no momento</p>
        <p className="mt-1 text-sm text-[#9A3412]">
          {message ?? "Nenhuma ação crítica está liberada nesta área."}
        </p>
      </div>
    </SettingsSectionCard>
  );
}
