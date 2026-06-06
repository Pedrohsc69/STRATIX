import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { SettingsSectionCard } from "./SettingsSectionCard";
import type { PersonalSettings } from "../types/settings.types";

type NotificationSettingsCardProps = {
  settings: PersonalSettings;
  onSave: (payload: {
    emailNotifications: boolean;
    inviteNotifications: boolean;
    okrNotifications: boolean;
    cycleNotifications: boolean;
  }) => Promise<void>;
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

  return "Não foi possível salvar as preferências de notificação.";
}

function ToggleRow(props: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-200 px-4 py-4">
      <div>
        <p className="text-sm font-medium text-[#1F2937]">{props.label}</p>
        <p className="mt-1 text-sm text-[#6B7280]">{props.description}</p>
      </div>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(event) => props.onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-gray-300 text-[#2BB3A3] focus:ring-[#2BB3A3]"
      />
    </label>
  );
}

export function NotificationSettingsCard({
  settings,
  onSave,
}: NotificationSettingsCardProps) {
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications);
  const [inviteNotifications, setInviteNotifications] = useState(settings.inviteNotifications);
  const [okrNotifications, setOkrNotifications] = useState(settings.okrNotifications);
  const [cycleNotifications, setCycleNotifications] = useState(settings.cycleNotifications);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setEmailNotifications(settings.emailNotifications);
    setInviteNotifications(settings.inviteNotifications);
    setOkrNotifications(settings.okrNotifications);
    setCycleNotifications(settings.cycleNotifications);
  }, [
    settings.cycleNotifications,
    settings.emailNotifications,
    settings.inviteNotifications,
    settings.okrNotifications,
  ]);

  return (
    <SettingsSectionCard
      title="Notificações"
      subtitle="Controle quais alertas devem chegar por email e no seu fluxo operacional."
      action={<BellRing className="h-5 w-5 text-[#1E4E79]" />}
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            setSaving(true);
            setError(null);
            await onSave({
              emailNotifications,
              inviteNotifications,
              okrNotifications,
              cycleNotifications,
            });
            setMessage("Preferências de notificação salvas.");
          } catch (requestError) {
            setMessage(null);
            setError(getRequestErrorMessage(requestError));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="space-y-3">
          <ToggleRow
            label="Resumo por email"
            description="Receba comunicações gerais e atualizações relevantes da plataforma."
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />
          <ToggleRow
            label="Convites"
            description="Receba alertas sobre convites enviados, aceitos ou expirados."
            checked={inviteNotifications}
            onChange={setInviteNotifications}
          />
          <ToggleRow
            label="OKRs"
            description="Receba alertas quando houver atualização de progresso ou atraso."
            checked={okrNotifications}
            onChange={setOkrNotifications}
          />
          <ToggleRow
            label="Ciclos estratégicos"
            description="Receba lembretes de ciclos prestes a iniciar ou encerrar."
            checked={cycleNotifications}
            onChange={setCycleNotifications}
          />
        </div>

        {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}
        {message ? <p className="text-sm text-[#166534]">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-[#0F2A44] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#123253] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar notificações"}
        </button>
      </form>
    </SettingsSectionCard>
  );
}
