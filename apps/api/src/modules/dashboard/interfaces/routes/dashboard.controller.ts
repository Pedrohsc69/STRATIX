import { Controller, Get, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../auth/auth.types';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { GetDashboardUseCase } from '../../application/use-cases/get-dashboard.usecase';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly getDashboardUseCase: GetDashboardUseCase) {}

  @Get()
  async getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.getDashboardUseCase.execute(user);
  }
}
