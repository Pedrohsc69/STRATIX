import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GetDashboardUseCase } from './application/use-cases/get-dashboard.usecase';
import { DASHBOARD_CACHE_REPOSITORY } from './domain/repositories/dashboard-cache.repository';
import { DashboardDomainService } from './domain/services/dashboard-domain.service';
import {
  DashboardCacheDocument,
  DashboardCacheSchema,
  MongoDashboardCacheRepository,
} from './infrastructure/cache/dashboard-cache.repository';
import { DashboardController } from './interfaces/routes/dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DashboardCacheDocument.name,
        schema: DashboardCacheSchema,
      },
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardDomainService,
    GetDashboardUseCase,
    MongoDashboardCacheRepository,
    {
      provide: DASHBOARD_CACHE_REPOSITORY,
      useExisting: MongoDashboardCacheRepository,
    },
  ],
  exports: [DASHBOARD_CACHE_REPOSITORY],
})
export class DashboardModule {}
