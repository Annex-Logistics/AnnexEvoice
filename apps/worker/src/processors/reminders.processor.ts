import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import type { Job } from 'bullmq';

import { PrismaService } from '../prisma.service.js';

@Processor('reminders')
export class RemindersProcessor extends WorkerHost {
  private readonly logger = new Logger(RemindersProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(_job: Job): Promise<unknown> {
    // On fire: look up overdue invoices in Africa/Lagos 'today' and send reminders.
    const overdue = await this.prisma.invoice.findMany({
      where: {
        dueAt: { lt: new Date() },
        status: { in: ['TRANSMITTED', 'PART_PAID'] },
      },
      take: 100,
    });
    this.logger.log(`[reminders] ${overdue.length} overdue invoices would be nudged`);
    return { overdue: overdue.length };
  }

  @Cron('0 9 * * *', { timeZone: 'Africa/Lagos' })
  dailyNudge() {
    this.logger.debug('reminder tick (daily 09:00 Africa/Lagos)');
  }
}
