import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { type AuditRequestLike, extractAuditRequestContext } from '../audit/audit-request.util';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ReportFormatDto } from './dto/report-format.dto';
import { ReportsService } from './reports.service';

type ExportResponse = {
  setHeader: (name: string, value: string) => void;
  send: (body: string | Buffer) => unknown;
};

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('options')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  getOptions(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.getOptions(user);
  }

  @Get('company/export')
  @Roles(UserRole.DIRECTOR)
  async exportCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ReportFormatDto,
    @Res() response: ExportResponse,
    @Req() request: AuditRequestLike,
  ) {
    const payload = await this.reportsService.exportCompany(
      user,
      query,
      extractAuditRequestContext(request),
    );
    this.sendExport(response, payload);
  }

  @Get('cycles/:cycleId/export')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  async exportCycle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cycleId') cycleId: string,
    @Query() query: ReportFormatDto,
    @Res() response: ExportResponse,
    @Req() request: AuditRequestLike,
  ) {
    const payload = await this.reportsService.exportCycle(
      user,
      cycleId,
      query,
      extractAuditRequestContext(request),
    );
    this.sendExport(response, payload);
  }

  @Get('departments/:departmentId/export')
  @Roles(UserRole.DIRECTOR, UserRole.MANAGER)
  async exportDepartment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('departmentId') departmentId: string,
    @Query() query: ReportFormatDto,
    @Res() response: ExportResponse,
    @Req() request: AuditRequestLike,
  ) {
    const payload = await this.reportsService.exportDepartment(
      user,
      departmentId,
      query,
      extractAuditRequestContext(request),
    );
    this.sendExport(response, payload);
  }

  private sendExport(
    response: ExportResponse,
    payload: {
      filename: string;
      contentType: string;
      content: string | Buffer;
    },
  ) {
    response.setHeader('Content-Type', payload.contentType);
    response.setHeader('Content-Disposition', `attachment; filename="${payload.filename}"`);
    response.send(payload.content);
  }
}
