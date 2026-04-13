import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  check() {
    return {
      name: 'STRATIX API',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
