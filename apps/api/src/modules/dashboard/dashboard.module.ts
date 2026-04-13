import { createFeatureModule, createReadModelController } from '../shared/module-factory';

const DashboardController = createReadModelController('dashboard', 'dashboard');

export class DashboardCard {
  constructor(
    public readonly label: string,
    public readonly value: number,
  ) {}
}

export class DashboardFilter {
  constructor(public readonly companyId: string) {}
}

export interface DashboardRepository {
  getSummary(companyId: string): Promise<DashboardCard[]>;
}

export class DashboardDomainService {
  sortByPriority(cards: DashboardCard[]) {
    return cards;
  }
}

export interface DashboardQueryDto {
  companyId: string;
}

export class GetDashboardUseCase {
  execute(input: DashboardQueryDto) {
    return input;
  }
}

export const DashboardModule = createFeatureModule(DashboardController);
