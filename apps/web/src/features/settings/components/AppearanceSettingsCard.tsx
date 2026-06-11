import { useEffect, useState } from "react";
import { MonitorCog } from "lucide-react";
import { useTheme } from "../../../core/theme/theme-context";
import { SettingsSectionCard } from "./SettingsSectionCard";
import type {
  InterfaceDensity,
  PersonalSettings,
  ThemePreference,
} from "../types/settings.types";

type AppearanceSettingsCardProps = {
  settings: PersonalSettings;
  onSave: (payload: {
    theme: ThemePreference;
    density: InterfaceDensity;
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

  return "Não foi possível salvar as preferências de aparência.";
}

export function AppearanceSettingsCard({
  settings,
  onSave,
}: AppearanceSettingsCardProps) {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const [theme, setTheme] = useState<ThemePreference>(preference);
  const [density, setDensity] = useState<InterfaceDensity>(settings.density);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTheme(preference);
    setDensity(settings.density);
  }, [preference, settings.density]);

  return (
    <SettingsSectionCard
      title="Aparência"
      subtitle="Personalize a forma como o STRATIX é apresentado para você."
      action={
        <MonitorCog className="h-5 w-5 text-[#1E4E79] dark:text-cyan-300" />
      }
    >
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            setSaving(true);
            setError(null);
            await onSave({ theme, density });
            setPreference(theme);
            setMessage("Preferências de aparência salvas.");
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
            <span className="text-sm font-medium text-[#1F2937] dark:text-slate-100">Tema</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemePreference)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] focus:border-[#2BB3A3] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="LIGHT">Claro</option>
              <option value="DARK">Escuro</option>
              <option value="SYSTEM">Sistema</option>
            </select>
            <p className="text-xs text-[#6B7280] dark:text-slate-400">
              Tema ativo: {resolvedTheme === "dark" ? "escuro" : "claro"}.
            </p>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[#1F2937] dark:text-slate-100">Densidade</span>
            <select
              value={density}
              onChange={(event) => setDensity(event.target.value as InterfaceDensity)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] focus:border-[#2BB3A3] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="COMFORTABLE">Confortável</option>
              <option value="COMPACT">Compacta</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-[#1F2937] dark:text-slate-100">Idioma</span>
            <input
              value="Português (Brasil)"
              readOnly
              className="w-full rounded-xl border border-gray-200 bg-[#F8FAFC] px-4 py-3 text-sm text-[#6B7280] outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-[#DC2626] dark:text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-[#166534] dark:text-emerald-400">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-[#0F2A44] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#123253] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E4E79] dark:hover:bg-[#25628F]"
        >
          {saving ? "Salvando..." : "Salvar aparência"}
        </button>
      </form>
    </SettingsSectionCard>
  );
}
