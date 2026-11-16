import { formatKoboAsNGN } from '@annexevoice/tax-engine';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import QRCode from 'qrcode';

import { PdfRendererService } from '../pdf/pdf-renderer.service.js';
import { StorageProviderToken, type StorageProvider } from '../storage/storage.provider.js';
import { WorkerTenantScope } from '../tenant-scope.js';

import type { NotificationJob } from './notifications.processor.js';

export interface PdfRenderJob {
  tenantId: string;
  invoiceId: string;
}

const SIGNED_URL_TTL_SECONDS = 24 * 60 * 60;

interface InvoiceForPdf {
  id: string;
  number: string | null;
  irn: string | null;
  qrPayload: string | null;
  issuedAt: Date | null;
  dueAt: Date | null;
  notes: string | null;
  subtotalKobo: bigint;
  vatKobo: bigint;
  whtKobo: bigint;
  totalKobo: bigint;
  tenant: { legalName: string; tradingName: string | null; tin: string | null; address: string | null };
  customer: { name: string; phone: string | null; email: string | null; tin: string | null; address: string | null };
  lines: Array<{ description: string; quantity: number; unitPriceKobo: bigint; lineTotalKobo: bigint; vatKobo: bigint }>;
}

@Processor('pdf-render')
export class PdfRenderProcessor extends WorkerHost {
  private readonly logger = new Logger(PdfRenderProcessor.name);

  constructor(
    private readonly scope: WorkerTenantScope,
    private readonly renderer: PdfRendererService,
    @Inject(StorageProviderToken) private readonly storage: StorageProvider,
    @InjectQueue('notifications') private readonly notifications: Queue<NotificationJob>,
  ) {
    super();
  }

  async process(job: Job<PdfRenderJob>): Promise<unknown> {
    const { tenantId, invoiceId } = job.data;

    const invoice = await this.scope.run(tenantId, (tx) =>
      tx.invoice.findFirst({
        where: { id: invoiceId, tenantId },
        include: { lines: true, customer: true, tenant: true },
      }),
    );
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found`);
    if (!invoice.number || !invoice.irn) return { skipped: 'not transmitted' };

    const qrDataUrl = invoice.qrPayload ? await QRCode.toDataURL(invoice.qrPayload) : null;
    const pdf = await this.renderer.render(buildInvoiceHtml(invoice, qrDataUrl));

    const key = `${tenantId}/${invoiceId}-${invoice.number}.pdf`;
    await this.storage.put(key, pdf, 'application/pdf');
    const pdfUrl = await this.storage.signedReadUrl(key, SIGNED_URL_TTL_SECONDS);

    await this.scope.run(tenantId, async (tx) => {
      await tx.invoice.update({ where: { id: invoiceId }, data: { pdfUrl } });
      await tx.auditEvent.create({
        data: {
          tenantId,
          action: 'invoice.pdf.rendered',
          entity: 'invoice',
          entityId: invoiceId,
          after: { storage: this.storage.name, key, bytes: pdf.length },
        },
      });
    });

    const filename = `${invoice.number}.pdf`;
    const attachments = [{ filename, url: pdfUrl }];
    if (invoice.customer.phone) {
      await this.notifications.add(
        'invoice-pdf',
        { channel: 'whatsapp', to: invoice.customer.phone, body: `Invoice ${invoice.number}`, attachments },
        { jobId: `invoice-pdf-whatsapp-${invoiceId}` },
      );
    }
    if (invoice.customer.email) {
      await this.notifications.add(
        'invoice-pdf',
        {
          channel: 'email',
          to: invoice.customer.email,
          subject: `Invoice ${invoice.number} from ${invoice.tenant.tradingName ?? invoice.tenant.legalName}`,
          attachments,
        },
        { jobId: `invoice-pdf-email-${invoiceId}` },
      );
    }

    this.logger.log(`Rendered ${invoice.number} (${pdf.length} bytes) to ${this.storage.name}`);
    return { key, bytes: pdf.length };
  }
}

export function buildInvoiceHtml(invoice: InvoiceForPdf, qrDataUrl: string | null): string {
  const ngn = (k: bigint) => esc(formatKoboAsNGN(k));
  const date = (d: Date | null) => (d ? esc(d.toISOString().slice(0, 10)) : '—');
  const rows = invoice.lines
    .map(
      (l) =>
        `<tr><td>${esc(l.description)}</td><td class="n">${l.quantity}</td><td class="n">${ngn(l.unitPriceKobo)}</td><td class="n">${ngn(l.vatKobo)}</td><td class="n">${ngn(l.lineTotalKobo)}</td></tr>`,
    )
    .join('');
  const seller = invoice.tenant;
  const buyer = invoice.customer;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(invoice.number ?? '')}</title>
<style>
  body { font-family: 'Liberation Sans', Arial, sans-serif; color: #0f172a; font-size: 11pt; }
  h1 { font-size: 20pt; margin: 0 0 4pt; }
  .muted { color: #475569; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18pt; }
  .parties { display: flex; gap: 32pt; margin-bottom: 16pt; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6pt; border-bottom: 1px solid #e2e8f0; text-align: left; }
  th { background: #f1f5f9; font-size: 9pt; text-transform: uppercase; }
  .n { text-align: right; white-space: nowrap; }
  .totals { margin-top: 12pt; margin-left: auto; width: 45%; }
  .totals td { border: none; padding: 3pt 6pt; }
  .grand td { font-weight: bold; font-size: 13pt; border-top: 2px solid #0f172a; }
  .irn { margin-top: 18pt; font-size: 9pt; }
</style></head><body>
<div class="head">
  <div><h1>Invoice ${esc(invoice.number ?? '')}</h1>
    <div class="muted">Issued ${date(invoice.issuedAt)} · Due ${date(invoice.dueAt)}</div></div>
  ${qrDataUrl ? `<img src="${qrDataUrl}" alt="NRS QR code" width="110" height="110"/>` : ''}
</div>
<div class="parties">
  <div><div class="muted">From</div><strong>${esc(seller.tradingName ?? seller.legalName)}</strong><br/>${esc(seller.legalName)}<br/>
    TIN: ${esc(seller.tin ?? '—')}${seller.address ? `<br/>${esc(seller.address)}` : ''}</div>
  <div><div class="muted">Billed to</div><strong>${esc(buyer.name)}</strong>
    ${buyer.tin ? `<br/>TIN: ${esc(buyer.tin)}` : ''}${buyer.address ? `<br/>${esc(buyer.address)}` : ''}</div>
</div>
<table><thead><tr><th>Item</th><th class="n">Qty</th><th class="n">Unit</th><th class="n">VAT</th><th class="n">Amount</th></tr></thead>
<tbody>${rows}</tbody></table>
<table class="totals">
  <tr><td>Subtotal</td><td class="n">${ngn(invoice.subtotalKobo)}</td></tr>
  <tr><td>VAT</td><td class="n">${ngn(invoice.vatKobo)}</td></tr>
  ${invoice.whtKobo > 0n ? `<tr><td>WHT deducted</td><td class="n">-${ngn(invoice.whtKobo)}</td></tr>` : ''}
  <tr class="grand"><td>Total</td><td class="n">${ngn(invoice.totalKobo)}</td></tr>
</table>
${invoice.notes ? `<p class="muted">${esc(invoice.notes)}</p>` : ''}
<div class="irn muted">IRN: ${esc(invoice.irn ?? '—')}</div>
</body></html>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
