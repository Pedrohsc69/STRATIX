import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_CACHE_REPOSITORY,
  DashboardCacheRepository,
} from '../../domain/repositories/dashboard-cache.repository';
import { DashboardDomainService } from '../../domain/services/dashboard-domain.service';

export interface DashboardQueryDto {
  companyId: string;
}

@Injectable()
export class GetDashboardUseCase {
  constructor(
    @Inject(DASHBOARD_CACHE_REPOSITORY)
    private readonly cacheRepository: DashboardCacheRepository,
    private readonly domainService: DashboardDomainService,
  ) {}

  async execute(input: DashboardQueryDto) {
    const cachedCards = await this.cacheRepository.getSummary(input.companyId);
    return this.domainService.sortByPriority(cachedCards ?? []);
  }
}
