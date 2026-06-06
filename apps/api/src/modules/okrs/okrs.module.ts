import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { OkrsController } from './okrs.controller';
import { OkrsService } from './okrs.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [OkrsController],
  providers: [OkrsService, DashboardDomainService, PrismaService],
})
export class OkrsModule {}
