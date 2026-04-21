import { Controller, Get, Query } from '@nestjs/common';
import { GetDashboardUseCase } from '../../application/use-cases/get-dashboard.usecase';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly getDashboardUseCase: GetDashboardUseCase) {}

  @Get()
  async getOverview(@Query('companyId') companyId = 'default-company') {
    return this.getDashboardUseCase.execute({ companyId });
  }
}
