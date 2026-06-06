import { Injectable } from '@nestjs/common';
import { AuditService } from '../../audit.service';

export interface CreateAuditCommand {
  userId: string;
  action: string;
  entity: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class CreateAuditUseCase {
  constructor(private readonly auditService: AuditService) {}

  async execute(command: CreateAuditCommand) {
    await this.auditService.log({
      actor: {
        id: command.userId,
        email: 'unknown@audit.local',
        role: 'SYSTEM',
      },
      action: command.action,
      entity: command.entity,
      metadata: command.metadata ?? null,
    });
  }
}
