import { useEffect, useMemo, useState } from "react";
import { fetchOkrs } from "../services/okrs.service";
import type { OkrsFilters, OkrsResponse } from "../types/okrs.types";

const defaultFilters: OkrsFilters = {
  search: "",
  departmentId: "",
  cycleId: "",
  objectiveId: "",
  responsibleId: "",
  status: "",
  ownOnly: false,
};

export function useOKRs() {
  const [data, setData] = useState<OkrsResponse | null>(null);
  const [filters, setFilters] = useState<OkrsFilters>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestFilters = useMemo(
    () => ({
      search: filters.search,
      departmentId: filters.departmentId,
      cycleId: filters.cycleId,
      objectiveId: filters.objectiveId,
      responsibleId: filters.responsibleId,
      status: filters.status,
      ownOnly: filters.ownOnly,
    }),
    [
      filters.search,
      filters.departmentId,
      filters.cycleId,
      filters.objectiveId,
      filters.responsibleId,
      filters.status,
      filters.ownOnly,
    ],
  );

  useEffect(() => {
    let active = true;

    async function loadOkrs() {
      try {
        setLoading(true);
        const response = await fetchOkrs(requestFilters);

        if (active) {
          setData(response);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Não foi possível carregar os OKRs.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadOkrs();

    return () => {
      active = false;
    };
  }, [
    requestFilters,
    reloadToken,
  ]);

  return {
    data,
    filters,
    loading,
    error,
    setFilters: (nextFilters: Partial<OkrsFilters>) =>
      setFilters((currentFilters) => ({
        ...currentFilters,
        ...nextFilters,
      })),
    resetFilters: () => setFilters(defaultFilters),
    reload: () => setReloadToken((current) => current + 1),
  };
}
