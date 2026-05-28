import { api } from "../../../services/api";
import type {
  OkrItem,
  OkrPayload,
  OkrProgressPayload,
  OkrsFilters,
  OkrsResponse,
} from "../types/okrs.types";

export async function fetchOkrs(filters: OkrsFilters) {
  const response = await api.get<OkrsResponse>("/okrs", {
    params: {
      search: filters.search || undefined,
      departmentId: filters.departmentId || undefined,
      cycleId: filters.cycleId || undefined,
      objectiveId: filters.objectiveId || undefined,
      responsibleId: filters.responsibleId || undefined,
      status: filters.status || undefined,
      ownOnly: filters.ownOnly ? "true" : undefined,
    },
  });

  return response.data;
}

export async function createOkr(payload: OkrPayload) {
  const response = await api.post<OkrItem>("/okrs", payload);
  return response.data;
}

export async function updateOkr(okrId: string, payload: OkrPayload) {
  const response = await api.patch<OkrItem>(`/okrs/${okrId}`, payload);
  return response.data;
}

export async function deleteOkr(okrId: string) {
  const response = await api.delete<{ success: boolean }>(`/okrs/${okrId}`);
  return response.data;
}

export async function addOkrProgress(okrId: string, payload: OkrProgressPayload) {
  const response = await api.post<OkrItem>(`/okrs/${okrId}/progress`, payload);
  return response.data;
}
