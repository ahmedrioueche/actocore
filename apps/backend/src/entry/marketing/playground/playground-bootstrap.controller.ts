import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { apiSuccess } from '@ahmedrioueche/actocore-shared';
import type { Request } from 'express';
import { Public } from '../../../auth/decorators/public.decorator';
import { PlaygroundBootstrapDto } from './playground-bootstrap.dto';
import { PlaygroundBootstrapGuard } from './playground.guard';
import { resolveRequestOrigin } from './playground-origin.util';
import { PlaygroundService } from './playground.service';

@Public()
@UseGuards(PlaygroundBootstrapGuard)
@Controller('marketing/playground')
export class PlaygroundBootstrapController {
  constructor(private readonly playground: PlaygroundService) {}

  @Post('bootstrap')
  @HttpCode(200)
  async bootstrap(@Body() body: PlaygroundBootstrapDto, @Req() req: Request) {
    const clientIp = req.ip ?? req.socket?.remoteAddress ?? 'unknown';
    const result = await this.playground.bootstrap({
      visitorId: body.visitorId,
      projectName: body.projectName,
      origin: resolveRequestOrigin(req),
      clientIp,
    });

    return apiSuccess(result);
  }
}
