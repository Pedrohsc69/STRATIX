import { api } from '../../../services/api';

export async function fetchHealth() {
  const response = await api.get('/health');
  return response.data as { name: string; status: string; timestamp: string };
}

export type CurrentCompany = {
  id: string;
  name: string;
  cnpj: string;
  businessArea: string;
  logoUrl?: string | null;
};

export async function fetchCurrentCompany() {
  const response = await api.get('/companies/current');
  return response.data as CurrentCompany;
}
