import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditEntity, AuditMetadata } from '../../domain/entities/audit.entity';
import { AUDIT_REPOSITORY, AuditRepository } from '../../domain/repositories/audit.repository';

export interface CreateAuditCommand {
  userId: string;
  action: string;
  entity: string;
  metadata?: AuditMetadata;
}

@Injectable()
export class CreateAuditUseCase {
  constructor(
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepository: AuditRepository,
  ) {}

  async execute(command: CreateAuditCommand) {
    const audit = new AuditEntity({
      id: randomUUID(),
      userId: command.userId,
      action: command.action,
      entity: command.entity,
      timestamp: new Date(),
      metadata: command.metadata ?? {},
    });

    return this.auditRepository.save(audit);
  }
}
