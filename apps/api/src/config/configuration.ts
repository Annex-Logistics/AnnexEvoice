export function loadConfig() {
  return {
    env: process.env.NODE_ENV ?? 'development',
    tz: process.env.TZ ?? 'Africa/Lagos',
    appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:5173',
    apiBaseUrl: process.env.API_BASE_URL ?? 'http://localhost:3000',
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me',
      accessTtl: Number(process.env.JWT_ACCESS_TTL ?? 900),
      refreshTtl: Number(process.env.JWT_REFRESH_TTL ?? 2_592_000),
    },
    providers: {
      einvoice: process.env.EINVOICE_PROVIDER ?? 'mock',
      whatsapp: process.env.WHATSAPP_PROVIDER ?? 'mock',
      payment: process.env.PAYMENT_PROVIDER ?? 'mock',
      paymentFallback: process.env.PAYMENT_FALLBACK_PROVIDER ?? 'mock',
      sms: process.env.SMS_PROVIDER ?? 'mock',
      email: process.env.EMAIL_PROVIDER ?? 'mock',
      kyc: process.env.KYC_PROVIDER ?? 'mock',
      bankFeed: process.env.BANK_FEED_PROVIDER ?? 'mock',
      storage: process.env.STORAGE_PROVIDER ?? 'mock',
      accounting: process.env.ACCOUNTING_PROVIDER ?? 'mock',
      llmParserEnabled: (process.env.LLM_PARSER_ENABLED ?? 'false') === 'true',
    },
    whatsapp: {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? '',
      wabaId: process.env.WHATSAPP_WABA_ID ?? '',
      appSecret: process.env.WHATSAPP_APP_SECRET ?? '',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? 'dev-verify-token',
      businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER ?? '',
    },
    paystack: {
      secretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
      publicKey: process.env.PAYSTACK_PUBLIC_KEY ?? '',
      webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? '',
    },
    features: {
      whatsappInvoicing: (process.env.FEATURE_WHATSAPP_INVOICING ?? 'true') === 'true',
      accountingSync: (process.env.FEATURE_ACCOUNTING_SYNC ?? 'false') === 'true',
      publicApi: (process.env.FEATURE_PUBLIC_API ?? 'true') === 'true',
    },
  };
}

export type AppConfig = ReturnType<typeof loadConfig>;
