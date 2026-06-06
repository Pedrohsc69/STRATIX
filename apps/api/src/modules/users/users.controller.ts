import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
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
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user);
  }

  @Patch('me/avatar')
  updateMyAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateAvatarDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.usersService.updateMyAvatar(user, body, extractAuditRequestContext(request));
  }

  @Get()
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListUsersDto,
  ) {
    return this.usersService.list(user, query);
  }

  @Get(':userId')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  getById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') userId: string,
  ) {
    return this.usersService.getById(user, userId);
  }
}
