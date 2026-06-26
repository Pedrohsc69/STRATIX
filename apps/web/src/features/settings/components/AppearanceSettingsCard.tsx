import { useEffect, useState } from "react";
import { MonitorCog } from "lucide-react";
import { useTheme } from "../../../core/theme/theme-context";
import { SettingsSectionCard } from "./SettingsSectionCard";
import type { PersonalSettings, ThemePreference } from "../types/settings.types";

type AppearanceSettingsCardProps = {
  settings: PersonalSettings;
  onSave: (payload: {
    theme: ThemePreference;
    language: string;
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

  return "NÃ£o foi possÃ­vel salvar as preferÃªncias de aparÃªncia.";
}

export function AppearanceSettingsCard({
  settings,
  onSave,
}: AppearanceSettingsCardProps) {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const [theme, setTheme] = useState<ThemePreference>(preference);
  const [language, setLanguage] = useState(settings.language);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTheme(preference);
    setLanguage(settings.language);
  }, [preference, settings.language]);

  return (
    <SettingsSectionCard
      title="AparÃªncia"
      subtitle="Personalize a forma como o STRATIX Ã© apresentado para vocÃª."
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
            await onSave({ theme, language });
            setPreference(theme);
            setMessage("PreferÃªncias de aparÃªncia salvas.");
          } catch (requestError) {
            setMessage(null);
            setError(getRequestErrorMessage(requestError));
          } finally {
            setSaving(false);
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
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
            <span className="text-sm font-medium text-[#1F2937] dark:text-slate-100">Idioma</span>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-[#1F2937] focus:border-[#2BB3A3] focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="pt-BR">PortuguÃªs (Brasil)</option>
            </select>
          </label>
        </div>

        {error ? <p className="text-sm text-[#DC2626] dark:text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-[#166534] dark:text-emerald-400">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-xl bg-[#0F2A44] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#123253] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E4E79] dark:hover:bg-[#25628F]"
        >
          {saving ? "Salvando..." : "Salvar aparÃªncia"}
        </button>
      </form>
    </SettingsSectionCard>
  );
}
