import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './core/shared/prisma.service';
import { validateEnv } from './config/env.validation';
import { MongoModule } from './infrastructure/database/mongo/mongo.module';
import { HealthController } from './interfaces/routes/health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventModule } from './modules/event/event.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { InvitesModule } from './modules/invites/invites.module';
import { ObjectivesModule } from './modules/objectives/objectives.module';
import { OkrsModule } from './modules/okrs/okrs.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SessionModule } from './modules/session/session.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StrategicCyclesModule } from './modules/strategic-cycles/strategic-cycles.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
    }),
    MongoModule,
    AuthModule,
    CompaniesModule,
    DepartmentsModule,
    InvitesModule,
    ObjectivesModule,
    OkrsModule,
    DashboardModule,
    ReportsModule,
    AuditModule,
    EventModule,
    SessionModule,
    SettingsModule,
    StrategicCyclesModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
