import { Module } from '@nestjs/common';
import { PrismaService } from './core/shared/prisma.service';
import { HealthController } from './interfaces/routes/health.controller';
import { CicloModule } from './modules/ciclo/ciclo.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DepartamentoModule } from './modules/departamento/departamento.module';
import { EmpresaModule } from './modules/empresa/empresa.module';
import { IamModule } from './modules/iam/iam.module';
import { ObjetivoModule } from './modules/objetivo/objetivo.module';
import { OkrModule } from './modules/okr/okr.module';
import { RelatorioModule } from './modules/relatorio/relatorio.module';

@Module({
  imports: [
    IamModule,
    EmpresaModule,
    DepartamentoModule,
    CicloModule,
    ObjetivoModule,
    OkrModule,
    DashboardModule,
    RelatorioModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
