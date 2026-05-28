import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportFormatDto } from './dto/report-format.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('options')
  @Roles(UserRole.DIRECTOR)
  getOptions(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getOptions(user);
  }

  @Get('company/export')
  @Roles(UserRole.DIRECTOR)
  async exportCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportFormatDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const payload = await this.reportsService.exportCompany(user, query);
    response.setHeader('Content-Type', payload.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    return payload.content;
  }

  @Get('cycles/:cycleId/export')
  @Roles(UserRole.DIRECTOR)
  async exportCycle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cycleId') cycleId: string,
    @Query() query: ReportFormatDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const payload = await this.reportsService.exportCycle(user, cycleId, query);
    response.setHeader('Content-Type', payload.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    return payload.content;
  }

  @Get('departments/:departmentId/export')
  @Roles(UserRole.DIRECTOR)
  async exportDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('departmentId') departmentId: string,
    @Query() query: ReportFormatDto,
    @Res({ passthrough: true }) response: any,
  ) {
    const payload = await this.reportsService.exportDepartment(user, departmentId, query);
    response.setHeader('Content-Type', payload.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    return payload.content;
  }
}
