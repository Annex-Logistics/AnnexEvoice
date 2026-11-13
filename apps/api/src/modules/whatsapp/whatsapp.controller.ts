import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Inject,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { Public } from '../../common/decorators.js';

import { MessagingProviderToken, type MessagingProvider } from './providers/messaging.provider.js';
import { WhatsappService } from './whatsapp.service.js';

@ApiTags('webhooks')
@Controller('webhooks/whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly config: ConfigService,
    @Inject(MessagingProviderToken) private readonly provider: MessagingProvider,
  ) {}

  /** Meta verification handshake: GET with hub.mode=subscribe. */
  @Get()
  @Public()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expected = this.config.get<string>('whatsapp.verifyToken') ?? process.env.WHATSAPP_VERIFY_TOKEN;
    if (mode !== 'subscribe' || token !== expected) throw new ForbiddenException();
    return challenge;
  }

  @Post()
  @Public()
  async receive(@Req() req: RawBodyRequest<Request>, @Headers('x-hub-signature-256') sig: string) {
    const raw = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    if (!this.provider.verifyWebhookSignature(raw, sig ?? '')) {
      throw new BadRequestException('Invalid signature');
    }
    const body = req.body as { entry?: { changes?: unknown[] }[] };
    return this.whatsapp.ingestWebhook((body?.entry ?? []) as never);
  }
}
