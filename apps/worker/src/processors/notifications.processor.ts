import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';

export interface NotificationJob {
  channel: 'whatsapp' | 'sms' | 'email';
  to: string;
  body?: string;
  subject?: string;
  html?: string;
  attachments?: Array<{ filename: string; url?: string }>;
}

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<NotificationJob>): Promise<unknown> {
    // Recipient is PII (phone/email); log the job id instead.
    this.logger.log(`[notify] ${job.data.channel} job ${job.id} (${job.data.attachments?.length ?? 0} attachments)`);
    return { ok: true };
  }
}
