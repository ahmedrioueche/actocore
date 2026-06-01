import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import type { Response } from 'express';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  /** Process is running (orchestrator liveness). */
  @Get('live')
  @HttpCode(HttpStatus.OK)
  getLive() {
    return apiSuccess(this.health.getLive());
  }

  /** Dependencies ready (load balancer readiness). */
  @Get(['', 'ready'])
  async getReady(@Res({ passthrough: true }) res: Response) {
    const data = await this.health.getReady();
    if (data.status !== 'ok') {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }
    return apiSuccess(data);
  }
}
