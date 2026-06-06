import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from '../../core/shared/prisma.service';
import { CreateAuditUseCase } from './application/use-cases/create-audit.usecase';
import { AuditService } from './audit.service';
import { AUDIT_REPOSITORY } from './domain/repositories/audit.repository';
import { MongoAuditRepository } from './infrastructure/database/audit.repository';
import { AuditLogDocument, AuditSchema } from './infrastructure/database/audit.schema';
import { AuditController } from './interfaces/routes/audit.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: AuditLogDocument.name,
        schema: AuditSchema,
      },
    ]),
  ],
  controllers: [AuditController],
  providers: [
    PrismaService,
    AuditService,
    CreateAuditUseCase,
    MongoAuditRepository,
    {
      provide: AUDIT_REPOSITORY,
      useExisting: MongoAuditRepository,
    },
  ],
  exports: [AuditService, CreateAuditUseCase, AUDIT_REPOSITORY],
})
export class AuditModule {}
