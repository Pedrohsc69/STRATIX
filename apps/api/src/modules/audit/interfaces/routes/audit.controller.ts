import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuditService } from '../../audit.service';
import type { AuthenticatedUser } from '../../../auth/auth.types';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Roles } from '../../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { ListAuditLogsDto } from '../../dto/list-audit-logs.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(UserRole.DIRECTOR)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListAuditLogsDto,
  ) {
    return this.auditService.list(user, query);
  }
}
