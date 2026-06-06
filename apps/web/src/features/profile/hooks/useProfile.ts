import { useEffect, useState } from "react";
import { fetchProfile } from "../services/profile.service";
import type { ProfileResponse } from "../types/profile.types";

export function useProfile() {
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const response = await fetchProfile();

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar o seu perfil.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  return {
    data,
    loading,
    error,
    reload: () => setReloadToken((current) => current + 1),
  };
}
