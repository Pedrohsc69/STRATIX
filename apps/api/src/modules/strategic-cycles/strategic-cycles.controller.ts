import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateStrategicCycleDto } from './dto/create-strategic-cycle.dto';
import { ListStrategicCyclesDto } from './dto/list-strategic-cycles.dto';
import { UpdateStrategicCycleDto } from './dto/update-strategic-cycle.dto';
import { StrategicCyclesService } from './strategic-cycles.service';

@Controller('strategic-cycles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StrategicCyclesController {
  constructor(private readonly strategicCyclesService: StrategicCyclesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListStrategicCyclesDto,
  ) {
    return this.strategicCyclesService.list(user, query);
  }

  @Post()
  @Roles(UserRole.DIRECTOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateStrategicCycleDto,
  ) {
    return this.strategicCyclesService.create(user, body);
  }

  @Patch(':cycleId')
  @Roles(UserRole.DIRECTOR)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cycleId') cycleId: string,
    @Body() body: UpdateStrategicCycleDto,
  ) {
    return this.strategicCyclesService.update(user, cycleId, body);
  }

  @Patch(':cycleId/close')
  @Roles(UserRole.DIRECTOR)
  close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cycleId') cycleId: string,
  ) {
    return this.strategicCyclesService.close(user, cycleId);
  }
}
