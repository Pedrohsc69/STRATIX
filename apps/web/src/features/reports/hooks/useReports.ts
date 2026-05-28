import { useEffect, useState } from "react";
import { fetchReportOptions } from "../services/reports.service";
import type { ReportsOptionsResponse } from "../types/reports.types";

export function useReports() {
  const [data, setData] = useState<ReportsOptionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      try {
        setLoading(true);
        const response = await fetchReportOptions();

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar as opções de relatórios.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadReports();

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
