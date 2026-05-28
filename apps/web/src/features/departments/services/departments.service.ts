import { api } from "../../../services/api";
import type {
  DepartmentCreatePayload,
  DepartmentDetailsResponse,
  DepartmentsFilters,
  DepartmentsResponse,
  DepartmentUpdatePayload,
} from "../types/departments.types";

export async function fetchDepartments(filters: DepartmentsFilters) {
  const response = await api.get<DepartmentsResponse>("/departments", {
    params: {
      search: filters.search || undefined,
      managerId: filters.managerId || undefined,
      status: filters.status || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
  });

  return response.data;
}

export async function fetchDepartmentDetails(departmentId: string) {
  const response = await api.get<DepartmentDetailsResponse>(`/departments/${departmentId}`);
  return response.data;
}

export async function createDepartment(payload: DepartmentCreatePayload) {
  const response = await api.post("/departments", payload);
  return response.data;
}

export async function updateDepartment(
  departmentId: string,
  payload: DepartmentUpdatePayload,
) {
  const response = await api.patch(`/departments/${departmentId}`, payload);
  return response.data;
}

export async function deleteDepartment(departmentId: string) {
  const response = await api.delete(`/departments/${departmentId}`);
  return response.data;
}
