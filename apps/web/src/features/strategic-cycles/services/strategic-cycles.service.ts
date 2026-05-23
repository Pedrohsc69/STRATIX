import { api } from "../../../services/api";
import type {
  StrategicCycleItem,
  StrategicCyclePayload,
  StrategicCyclesFilters,
  StrategicCyclesResponse,
} from "../types/strategic-cycles.types";

export async function fetchStrategicCycles(filters: StrategicCyclesFilters) {
  const response = await api.get<StrategicCyclesResponse>("/strategic-cycles", {
    params: {
      search: filters.search || undefined,
      departmentId: filters.departmentId || undefined,
      status: filters.status || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    },
  });

  return response.data;
}

export async function createStrategicCycle(payload: StrategicCyclePayload) {
  const response = await api.post<StrategicCycleItem>("/strategic-cycles", payload);
  return response.data;
}

export async function updateStrategicCycle(cycleId: string, payload: StrategicCyclePayload) {
  const response = await api.patch<StrategicCycleItem>(`/strategic-cycles/${cycleId}`, payload);
  return response.data;
}

export async function closeStrategicCycle(cycleId: string) {
  const response = await api.patch<StrategicCycleItem>(`/strategic-cycles/${cycleId}/close`);
  return response.data;
}
