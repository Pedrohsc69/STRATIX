import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreateAuditUseCase } from './application/use-cases/create-audit.usecase';
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
    CreateAuditUseCase,
    MongoAuditRepository,
    {
      provide: AUDIT_REPOSITORY,
      useClass: MongoAuditRepository,
    },
  ],
  exports: [CreateAuditUseCase, AUDIT_REPOSITORY],
})
export class AuditModule {}
