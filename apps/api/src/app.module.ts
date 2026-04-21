import { Module } from '@nestjs/common';
import { PrismaService } from './core/shared/prisma.service';
import { MongoModule } from './infrastructure/database/mongo/mongo.module';
import { HealthController } from './interfaces/routes/health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { CicloModule } from './modules/ciclo/ciclo.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DepartamentoModule } from './modules/departamento/departamento.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { EventModule } from './modules/event/event.module';
import { IamModule } from './modules/iam/iam.module';
import { ObjetivoModule } from './modules/objetivo/objetivo.module';
import { OkrModule } from './modules/okr/okr.module';
import { RelatorioModule } from './modules/relatorio/relatorio.module';
import { SessionModule } from './modules/session/session.module';

@Module({
  imports: [
    MongoModule,
    IamModule,
    EmpresaModule,
    DepartamentoModule,
    CicloModule,
    ObjetivoModule,
    OkrModule,
    DashboardModule,
    RelatorioModule,
    AuditModule,
    EventModule,
    SessionModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
