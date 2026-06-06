import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
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
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';
import { UpdateMySettingsDto } from './dto/update-my-settings.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getMe(user);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateMySettingsDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.settingsService.updateMe(user, body, extractAuditRequestContext(request));
  }

  @Get('company')
  @Roles(UserRole.DIRECTOR)
  getCompany(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.getCompany(user);
  }

  @Patch('company')
  @Roles(UserRole.DIRECTOR)
  updateCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateCompanySettingsDto,
    @Req() request: AuditRequestLike,
  ) {
    return this.settingsService.updateCompany(
      user,
      body,
      extractAuditRequestContext(request),
    );
  }
}
