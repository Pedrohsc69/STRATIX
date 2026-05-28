import { api } from "../../../services/api";
import type {
  ObjectiveItem,
  ObjectivePayload,
  ObjectivesFilters,
  ObjectivesResponse,
} from "../types/objectives.types";

export async function fetchObjectives(filters: ObjectivesFilters) {
  const response = await api.get<ObjectivesResponse>("/objectives", {
    params: {
      search: filters.search || undefined,
      departmentId: filters.departmentId || undefined,
      cycleId: filters.cycleId || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
    },
  });

  return response.data;
}

export async function createObjective(payload: ObjectivePayload) {
  const response = await api.post<ObjectiveItem>("/objectives", payload);
  return response.data;
}

export async function updateObjective(objectiveId: string, payload: ObjectivePayload) {
  const response = await api.patch<ObjectiveItem>(`/objectives/${objectiveId}`, payload);
  return response.data;
}

export async function deleteObjective(objectiveId: string) {
  const response = await api.delete<{ success: boolean }>(`/objectives/${objectiveId}`);
  return response.data;
}
