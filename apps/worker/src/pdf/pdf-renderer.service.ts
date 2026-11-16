import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { chromium, type Browser } from 'playwright';

@Injectable()
export class PdfRendererService implements OnModuleDestroy {
  private readonly logger = new Logger(PdfRendererService.name);
  private browser: Promise<Browser> | null = null;

  async render(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({ javaScriptEnabled: false });
    try {
      const page = await context.newPage();
      // Invoice HTML is self-contained (QR is a data: URL); refuse anything else so
      // customer-supplied text can never make Chromium fetch a remote resource.
      await page.route('**/*', (route) =>
        route.request().url().startsWith('data:') ? route.continue() : route.abort(),
      );
      await page.setContent(html, { waitUntil: 'load' });
      return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' } });
    } finally {
      await context.close();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.browser) await (await this.browser).close();
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined;
      this.logger.log(`Launching Chromium${executablePath ? ` from ${executablePath}` : ''}`);
      this.browser = chromium
        .launch({ executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
        .catch((err) => {
          this.browser = null;
          throw err;
        });
    }
    return this.browser;
  }
}
