import { api } from '../../../services/api';

export async function fetchHealth() {
  const response = await api.get('/health');
  return response.data as { name: string; status: string; timestamp: string };
}
