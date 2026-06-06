import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  type AuditRequestLike,
  extractAuditRequestContext,
} from '../audit/audit-request.util';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

@Controller('invites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post()
  @Roles(UserRole.DIRECTOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateInviteDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.invitesService.create(user, body, extractAuditRequestContext(request));
  }

  @Get()
  @Roles(UserRole.DIRECTOR)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.invitesService.list(user);
  }

  @Get(':inviteId')
  @Roles(UserRole.DIRECTOR)
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId') inviteId: string,
  ) {
    return this.invitesService.getById(user, inviteId);
  }

  @Post(':inviteId/resend')
  @Roles(UserRole.DIRECTOR)
  resend(
    @CurrentUser() user: AuthenticatedUser,
    @Param('inviteId') inviteId: string,
    @Req() request: AuditRequestLike,
  ) {
    return this.invitesService.resend(user, inviteId, extractAuditRequestContext(request));
  }
}
