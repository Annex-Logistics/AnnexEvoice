import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import QRCode from 'qrcode';

import { PrismaService } from '../prisma.service.js';

export interface PdfRenderJob {
  tenantId: string;
  invoiceId: string;
}

@Processor('pdf-render')
export class PdfRenderProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfRenderProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<PdfRenderJob>): Promise<unknown> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: job.data.invoiceId, tenantId: job.data.tenantId },
      include: { lines: true, customer: true, tenant: true },
    });
    if (!invoice) return { skipped: true };

    const qrDataUrl = invoice.qrPayload ? await QRCode.toDataURL(invoice.qrPayload) : null;
    const html = this.buildHtml(invoice, qrDataUrl);

    // In production: launch Chromium via playwright, render html, upload PDF to GCS,
    // save signed URL on invoice.pdfUrl. For the scaffold we only log the intent.
    this.logger.log(`[pdf] would render invoice ${invoice.number ?? invoice.id} (${html.length} bytes html)`);
    return { ok: true };
  }

  private buildHtml(invoice: {
    number: string | null;
    tenant: { legalName: string; tin: string | null };
    customer: { name: string };
    lines: Array<{ description: string; quantity: number; unitPriceKobo: bigint; lineTotalKobo: bigint; vatKobo: bigint }>;
    subtotalKobo: bigint;
    vatKobo: bigint;
    totalKobo: bigint;
  }, qrDataUrl: string | null): string {
    const fmt = (k: bigint) => `₦${(Number(k) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    const rows = invoice.lines
      .map(
        (l) =>
          `<tr><td>${esc(l.description)}</td><td>${l.quantity}</td><td>${fmt(l.unitPriceKobo)}</td><td>${fmt(l.lineTotalKobo)}</td></tr>`,
      )
      .join('');
    return `<!doctype html><html><body style="font-family: system-ui;">
<h1>Invoice ${esc(invoice.number ?? '')}</h1>
<p><strong>${esc(invoice.tenant.legalName)}</strong><br/>TIN: ${esc(invoice.tenant.tin ?? '')}</p>
<p>Billed to: <strong>${esc(invoice.customer.name)}</strong></p>
<table border="1" cellpadding="6"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
<p>Subtotal: ${fmt(invoice.subtotalKobo)}<br/>VAT: ${fmt(invoice.vatKobo)}<br/><strong>Total: ${fmt(invoice.totalKobo)}</strong></p>
${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" width="120" height="120"/>` : ''}
</body></html>`;
  }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}
