import { api } from '../../../services/api';
import type { SessionState } from '../../../store/app-store';

type RegisterDirectorInput = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type CreateCompanyInput = {
  name: string;
  cnpj: string;
  businessArea: string;
};

type CreateDepartmentInput = {
  name: string;
};

type CreateInviteInput = {
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
  departmentId: string;
};

type InviteDetails = {
  email: string;
  role: 'MANAGER' | 'EMPLOYEE';
  companyName: string;
  departmentName: string | null;
};

type AcceptInviteInput = {
  name: string;
  token: string;
  password: string;
  confirmPassword: string;
};

export async function registerDirector(input: RegisterDirectorInput) {
  const response = await api.post<SessionState>('/auth/register-director', input);
  return response.data;
}

export async function login(input: LoginInput) {
  const response = await api.post<SessionState>('/auth/login', input);
  return response.data;
}

export async function createCompany(input: CreateCompanyInput) {
  const response = await api.post('/companies', input);
  return response.data as {
    id: string;
    name: string;
    cnpj: string;
    businessArea: string;
  };
}

export async function createDepartment(input: CreateDepartmentInput) {
  const response = await api.post('/departments', input);
  return response.data as {
    id: string;
    name: string;
    companyId: string;
  };
}

export async function createInvite(input: CreateInviteInput) {
  const response = await api.post('/invites', input);
  return response.data as {
    id: string;
    email: string;
    role: 'MANAGER' | 'EMPLOYEE';
    departmentId: string;
    expiresAt: string;
  };
}

export async function getInviteDetails(token: string) {
  const response = await api.get<InviteDetails>('/auth/invite-details', {
    params: { token },
  });

  return response.data;
}

export async function acceptInvite(input: AcceptInviteInput) {
  const response = await api.post<SessionState>('/auth/accept-invite', input);
  return response.data;
}
