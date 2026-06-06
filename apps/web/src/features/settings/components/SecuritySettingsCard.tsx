import { Link } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { SettingsSectionCard } from "./SettingsSectionCard";

type SecuritySettingsCardProps = {
  profilePath: string;
  lastAccessAt: string | null;
};

function formatLastAccess(value: string | null) {
  if (!value) {
    return "Ainda não registrado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function SecuritySettingsCard({
  profilePath,
  lastAccessAt,
}: SecuritySettingsCardProps) {
  return (
    <SettingsSectionCard
      title="Segurança"
      subtitle="As ações sensíveis do seu perfil continuam centralizadas fora de Configurações."
      action={<LockKeyhole className="h-5 w-5 text-[#1E4E79]" />}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-4">
          <p className="text-sm font-medium text-[#1F2937]">Último acesso registrado</p>
          <p className="mt-1 text-sm text-[#6B7280]">{formatLastAccess(lastAccessAt)}</p>
        </div>

        <div className="rounded-xl border border-gray-200 px-4 py-4">
          <p className="text-sm font-medium text-[#1F2937]">Senha e identidade</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            A troca de senha, recuperação e avatar permanecem no seu Perfil para evitar
            duplicação de responsabilidades.
          </p>
          <Link
            to={profilePath}
            className="mt-4 inline-flex items-center justify-center rounded-xl border border-[#0F2A44] px-4 py-2.5 text-sm font-medium text-[#0F2A44] transition-colors hover:bg-[#F8FAFC]"
          >
            Ir para meu perfil
          </Link>
        </div>
      </div>
    </SettingsSectionCard>
  );
}
