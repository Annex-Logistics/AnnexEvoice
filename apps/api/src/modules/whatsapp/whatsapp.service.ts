import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConversationState, MessageDirection, MessageKind } from '@prisma/client';
import { Queue } from 'bullmq';

import { PrismaService } from '../../prisma/prisma.service.js';
import { TenantScope } from '../../prisma/tenant-scope.js';

import { MessagingProviderToken, type MessagingProvider } from './providers/messaging.provider.js';

export interface MetaWebhookChange {
  value?: {
    messages?: Array<{
      id: string;
      from: string;
      type: string;
      text?: { body: string };
      interactive?: unknown;
      timestamp: string;
    }>;
  };
}

export interface MetaWebhookEntry {
  changes?: MetaWebhookChange[];
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: TenantScope,
    @Inject(MessagingProviderToken) private readonly provider: MessagingProvider,
    @InjectQueue('whatsapp-inbound') private readonly inboundQueue: Queue,
  ) {}

  async ingestWebhook(entries: MetaWebhookEntry[]) {
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        for (const message of change.value?.messages ?? []) {
          // Dedupe: wa_message_id is globally unique; rely on it to make this idempotent.
          const existing = await this.prisma.whatsappMessage.findUnique({ where: { waMessageId: message.id } });
          if (existing) continue;

          const tenant = await this.resolveTenantByPhone(message.from);
          if (!tenant) {
            this.logger.warn(`Unknown WhatsApp sender ${message.from}`);
            continue;
          }
          const conversation = await this.prisma.whatsappConversation.upsert({
            where: { tenantId_phone: { tenantId: tenant.id, phone: message.from } },
            update: { lastMessageAt: new Date() },
            create: {
              tenantId: tenant.id,
              phone: message.from,
              state: ConversationState.IDLE,
              lastMessageAt: new Date(),
            },
          });
          await this.prisma.whatsappMessage.create({
            data: {
              conversationId: conversation.id,
              waMessageId: message.id,
              direction: MessageDirection.INBOUND,
              kind: this.messageKind(message.type),
              body: message.text?.body,
              payload: message as object,
            },
          });
          await this.inboundQueue.add(
            'process',
            { tenantId: tenant.id, waMessageId: message.id, conversationId: conversation.id },
            { attempts: 3, backoff: { type: 'exponential', delay: 2_000 } },
          );
        }
      }
    }
    return { accepted: true };
  }

  async healthCheck() {
    return this.provider.healthCheck();
  }

  private async resolveTenantByPhone(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone }, include: { memberships: true } });
    const membership = user?.memberships[0];
    if (!membership) return null;
    return this.prisma.tenant.findUnique({ where: { id: membership.tenantId } });
  }

  private messageKind(type: string): MessageKind {
    switch (type) {
      case 'text':
        return MessageKind.TEXT;
      case 'image':
        return MessageKind.IMAGE;
      case 'document':
        return MessageKind.DOCUMENT;
      case 'audio':
      case 'voice':
        return MessageKind.VOICE;
      case 'interactive':
      case 'button':
        return MessageKind.INTERACTIVE;
      case 'template':
        return MessageKind.TEMPLATE;
      default:
        return MessageKind.TEXT;
    }
  }
}
