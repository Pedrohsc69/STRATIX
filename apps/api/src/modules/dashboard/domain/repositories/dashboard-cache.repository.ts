import { DashboardCard } from '../entities/dashboard-card.entity';

export const DASHBOARD_CACHE_REPOSITORY = Symbol('DASHBOARD_CACHE_REPOSITORY');

export interface DashboardCacheRepository {
  saveSummary(companyId: string, cards: DashboardCard[]): Promise<void>;
  getSummary(companyId: string): Promise<DashboardCard[] | null>;
}
