import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { ListDepartmentsDto } from './dto/list-departments.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentsService } from './departments.service';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListDepartmentsDto,
  ) {
    return this.departmentsService.list(user, query);
  }

  @Get(':departmentId')
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('departmentId') departmentId: string,
  ) {
    return this.departmentsService.getById(user, departmentId);
  }

  @Post()
  @Roles(UserRole.DIRECTOR)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateDepartmentDto,
  ) {
    return this.departmentsService.create(user, body);
  }

  @Patch(':departmentId')
  @Roles(UserRole.DIRECTOR)
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('departmentId') departmentId: string,
    @Body() body: UpdateDepartmentDto,
  ) {
    return this.departmentsService.update(user, departmentId, body);
  }

  @Delete(':departmentId')
  @Roles(UserRole.DIRECTOR)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('departmentId') departmentId: string,
  ) {
    return this.departmentsService.remove(user, departmentId);
  }
}
