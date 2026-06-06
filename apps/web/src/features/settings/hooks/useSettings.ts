import { useEffect, useState } from "react";
import { fetchSettings } from "../services/settings.service";
import type { SettingsResponse } from "../types/settings.types";

export function useSettings() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        setLoading(true);
        const response = await fetchSettings();

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar as configurações.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadToken((current) => current + 1),
    setData,
  };
}
