import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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
import { AddOkrProgressDto } from './dto/add-okr-progress.dto';
import { CreateOkrDto } from './dto/create-okr.dto';
import { ListOkrsDto } from './dto/list-okrs.dto';
import { UpdateOkrDto } from './dto/update-okr.dto';
import { OkrsService } from './okrs.service';

@Controller('okrs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OkrsController {
  constructor(private readonly okrsService: OkrsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOkrsDto,
  ) {
    return this.okrsService.list(user, query);
  }

  @Post()
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateOkrDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.okrsService.create(user, body, extractAuditRequestContext(request));
  }

  @Patch(':okrId')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('okrId') okrId: string,
    @Body() body: UpdateOkrDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.okrsService.update(user, okrId, body, extractAuditRequestContext(request));
  }

  @Delete(':okrId')
  @Roles(UserRole.DIRECTOR)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('okrId') okrId: string,
    @Req() request: AuditRequestLike,
  ) {
    return this.okrsService.remove(user, okrId, extractAuditRequestContext(request));
  }

  @Post(':okrId/progress')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER, UserRole.EMPLOYEE)
  addProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('okrId') okrId: string,
    @Body() body: AddOkrProgressDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.okrsService.addProgress(
      user,
      okrId,
      body,
      extractAuditRequestContext(request),
    );
  }
}
