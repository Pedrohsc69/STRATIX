import { Module } from '@nestjs/common';
import { PrismaService } from '../../core/shared/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { DashboardDomainService } from '../dashboard/domain/services/dashboard-domain.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';

@Module({
  imports: [AuthModule],
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DashboardDomainService, PrismaService],
})
export class DepartmentsModule {}
