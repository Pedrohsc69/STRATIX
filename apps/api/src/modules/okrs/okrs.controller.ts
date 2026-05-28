import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
  ) {
    return this.okrsService.create(user, body);
  }

  @Patch(':okrId')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('okrId') okrId: string,
    @Body() body: UpdateOkrDto,
  ) {
    return this.okrsService.update(user, okrId, body);
  }

  @Delete(':okrId')
  @Roles(UserRole.DIRECTOR)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('okrId') okrId: string,
  ) {
    return this.okrsService.remove(user, okrId);
  }

  @Post(':okrId/progress')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER, UserRole.EMPLOYEE)
  addProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('okrId') okrId: string,
    @Body() body: AddOkrProgressDto,
  ) {
    return this.okrsService.addProgress(user, okrId, body);
  }
}
