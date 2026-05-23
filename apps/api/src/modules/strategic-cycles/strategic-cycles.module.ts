import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { StrategicCyclesController } from './strategic-cycles.controller';
import { StrategicCyclesService } from './strategic-cycles.service';

@Module({
  imports: [AuthModule],
  controllers: [StrategicCyclesController],
  providers: [StrategicCyclesService, DashboardDomainService, PrismaService],
})
export class StrategicCyclesModule {}
