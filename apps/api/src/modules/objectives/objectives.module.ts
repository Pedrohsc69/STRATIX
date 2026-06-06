import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { ObjectivesController } from './objectives.controller';
import { ObjectivesService } from './objectives.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ObjectivesController],
  providers: [ObjectivesService, DashboardDomainService, PrismaService],
})
export class ObjectivesModule {}
