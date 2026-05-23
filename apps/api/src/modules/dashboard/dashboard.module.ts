import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { GetDashboardUseCase } from './application/use-cases/get-dashboard.usecase';
import { DashboardDomainService } from './domain/services/dashboard-domain.service';
import { DashboardController } from './interfaces/routes/dashboard.controller';

@Module({
  imports: [AuthModule],
  controllers: [DashboardController],
  providers: [DashboardDomainService, GetDashboardUseCase, PrismaService],
})
export class DashboardModule {}
