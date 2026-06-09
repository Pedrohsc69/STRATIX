import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { PdfLayoutService } from './pdf/pdf-layout.service';
import { PdfReportService } from './pdf/pdf-report.service';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, AuditModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    DashboardDomainService,
    PrismaService,
    PdfLayoutService,
    PdfReportService,
  ],
})
export class ReportsModule {}
