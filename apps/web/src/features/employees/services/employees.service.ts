import { api } from "../../../services/api";
import type {
  EmployeeDetailsResponse,
  EmployeesFilters,
  EmployeesResponse,
} from "../types/employees.types";

type InviteEmployeePayload = {
  name: string;
  email: string;
  role: "MANAGER" | "EMPLOYEE";
  departmentId: string;
};

export async function fetchEmployees(filters: EmployeesFilters) {
  const response = await api.get<EmployeesResponse>("/users", {
    params: {
      search: filters.search || undefined,
      departmentId: filters.departmentId || undefined,
      role: filters.role || undefined,
      status: filters.status || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    },
  });

  return response.data;
}

export async function fetchEmployeeDetails(userId: string) {
  const response = await api.get<EmployeeDetailsResponse>(`/users/${userId}`);
  return response.data;
}

export async function inviteEmployee(payload: InviteEmployeePayload) {
  const response = await api.post("/invites", payload);
  return response.data;
}

export async function resendInvite(inviteId: string) {
  const response = await api.post(`/invites/${inviteId}/resend`);
  return response.data;
}
