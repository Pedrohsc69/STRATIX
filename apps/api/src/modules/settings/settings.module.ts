import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [SettingsController],
  providers: [SettingsService, DashboardDomainService, PrismaService],
})
export class SettingsModule {}
