import { Body, Controller, Post } from '@nestjs/common';
import { CreateAuditUseCase } from '../../application/use-cases/create-audit.usecase';

interface CreateAuditRequest {
  userId: string;
  action: string;
  entity: string;
  metadata?: Record<string, unknown>;
}

@Controller('audit')
export class AuditController {
  constructor(private readonly createAuditUseCase: CreateAuditUseCase) {}

  @Post('logs')
  async createLog(@Body() body: CreateAuditRequest) {
    return this.createAuditUseCase.execute(body);
  }
}
