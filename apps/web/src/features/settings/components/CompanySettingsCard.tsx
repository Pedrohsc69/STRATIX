import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { SettingsSectionCard } from "./SettingsSectionCard";
import type {
  CompanySettings,
  UpdateCompanySettingsPayload,
} from "../types/settings.types";

type CompanySettingsCardProps = {
  company: CompanySettings;
  onSave: (payload: UpdateCompanySettingsPayload) => Promise<void>;
};

function getRequestErrorMessage(requestError: unknown) {
  const maybeError = requestError as {
    response?: {
      data?: {
        message?: string | string[];
      };
    };
  };

  if (typeof maybeError.response?.data?.message === "string") {
    return maybeError.response.data.message;
  }

  if (Array.isArray(maybeError.response?.data?.message)) {
    return maybeError.response.data.message.join(", ");
  }

  return "Não foi possível salvar as configurações da empresa.";
}

export function CompanySettingsCard({
  company,
  onSave,
}: CompanySettingsCardProps) {
  const [name, setName] = useState(company.name);
  const [cnpj, setCnpj] = useState(company.cnpj);
  const [businessArea, setBusinessArea] = useState(company.businessArea);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(company.name);
    setCnpj(company.cnpj);
    setBusinessArea(company.businessArea);
  }, [company.businessArea, company.cnpj, company.name]);

  return (
    <SettingsSectionCard
      title="Empresa"
      subtitle="Parâmetros institucionais protegidos para a diretoria da empresa."
      action={<Building2 className="h-5 w-5 text-[#1E4E79]" />}
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            setSaving(true);
            setError(null);
            await onSave({
              name,
              cnpj,
              businessArea,
            });
            setMessage("Configurações da empresa salvas.");
          } catch (requestError) {
            setMessage(null);
            setError(getRequestErrorMessage(requestError));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-[#1F2937]">Nome da empresa</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={!company.canEdit}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] focus:border-[#2BB3A3] focus:outline-none disabled:bg-[#F8FAFC]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[#1F2937]">CNPJ</span>
            <input
              value={cnpj}
              onChange={(event) => setCnpj(event.target.value)}
              disabled={!company.canEdit}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] focus:border-[#2BB3A3] focus:outline-none disabled:bg-[#F8FAFC]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[#1F2937]">Área de atuação</span>
            <input
              value={businessArea}
              onChange={(event) => setBusinessArea(event.target.value)}
              disabled={!company.canEdit}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] focus:border-[#2BB3A3] focus:outline-none disabled:bg-[#F8FAFC]"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}
        {message ? <p className="text-sm text-[#166534]">{message}</p> : null}

        <button
          type="submit"
          disabled={saving || !company.canEdit}
          className="inline-flex items-center justify-center rounded-xl bg-[#0F2A44] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#123253] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar empresa"}
        </button>
      </form>
    </SettingsSectionCard>
  );
}
