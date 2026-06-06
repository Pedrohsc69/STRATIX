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
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { ListObjectivesDto } from './dto/list-objectives.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';
import { ObjectivesService } from './objectives.service';

@Controller('objectives')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ObjectivesController {
  constructor(private readonly objectivesService: ObjectivesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListObjectivesDto,
  ) {
    return this.objectivesService.list(user, query);
  }

  @Post()
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateObjectiveDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.objectivesService.create(user, body, extractAuditRequestContext(request));
  }

  @Patch(':objectiveId')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('objectiveId') objectiveId: string,
    @Body() body: UpdateObjectiveDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.objectivesService.update(
      user,
      objectiveId,
      body,
      extractAuditRequestContext(request),
    );
  }

  @Delete(':objectiveId')
  @Roles(UserRole.DIRECTOR)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('objectiveId') objectiveId: string,
    @Req() request: AuditRequestLike,
  ) {
    return this.objectivesService.remove(user, objectiveId, extractAuditRequestContext(request));
  }
}
