// Generated from the API's /openapi.json by `pnpm api:generate`. Do not edit by hand.
export interface paths {
    "/v1/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_live_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/health/ready": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["HealthController_ready_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/otp/request": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_requestOtp_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/otp/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_verifyOtp_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/password/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_passwordLogin_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/auth/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["AuthController_refresh_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["UsersController_list_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tenants/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TenantsController_me_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["TenantsController_update_v1"];
        trace?: never;
    };
    "/v1/customers": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CustomersController_list_v1"];
        put?: never;
        post: operations["CustomersController_create_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/customers/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CustomersController_get_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["CustomersController_update_v1"];
        trace?: never;
    };
    "/v1/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProductsController_list_v1"];
        put?: never;
        post: operations["ProductsController_create_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/products/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ProductsController_get_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["ProductsController_update_v1"];
        trace?: never;
    };
    "/v1/tax/rules": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TaxController_rules_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/tax/summary": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["TaxController_summary_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/invoices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvoicesController_list_v1"];
        put?: never;
        post: operations["InvoicesController_createDraft_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/invoices/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["InvoicesController_get_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/invoices/{id}/issue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["InvoicesController_issue_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/invoices/{id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["InvoicesController_cancel_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/credit-notes": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["CreditNotesController_list_v1"];
        put?: never;
        post: operations["CreditNotesController_create_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/einvoice/submissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EInvoiceController_list_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/einvoice/submissions/{id}/retry": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["EInvoiceController_retry_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/einvoice/provider/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["EInvoiceController_health_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/payments": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PaymentsController_list_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/payments/invoices/{id}/link": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PaymentsController_createLink_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/paystack": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["WebhooksController_paystack_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/webhooks/whatsapp": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["WhatsappController_verify_v1"];
        put?: never;
        post: operations["WhatsappController_receive_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/billing/plans": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BillingController_plans_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/billing/subscription": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["BillingController_subscription_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/billing/subscribe": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["BillingController_subscribe_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["IntegrationsController_list_v1"];
        put?: never;
        post: operations["IntegrationsController_connect_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/integrations/{provider}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["IntegrationsController_disconnect_v1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/audit-events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AuditController_list_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public/invoices": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicApiController_list_v1"];
        put?: never;
        post: operations["PublicApiController_create_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public/invoices/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["PublicApiController_get_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/public/invoices/{id}/issue": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["PublicApiController_issue_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api-keys": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ApiKeysController_list_v1"];
        put?: never;
        post: operations["ApiKeysController_issue_v1"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/api-keys/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["ApiKeysController_revoke_v1"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/tenants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminController_tenants_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/submissions/dlq": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminController_dlq_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/admin/integrations/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["AdminController_health_v1"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        RequestOtpDto: {
            phone: string;
        };
        OtpRequestResponse: {
            /** @example issued */
            status: string;
            /** @description Only returned outside production. */
            devCode?: string;
        };
        VerifyOtpDto: {
            phone: string;
            code: string;
        };
        /** @enum {string} */
        Role: "OWNER" | "STAFF" | "ACCOUNTANT" | "ADMIN";
        AuthTokensResponse: {
            accessToken: string;
            /** Format: uuid */
            tenantId: string;
            role: components["schemas"]["Role"];
        };
        PasswordLoginDto: {
            /** Format: email */
            email?: string;
            phone?: string;
            password: string;
        };
        /** @enum {string} */
        KycTier: "TIER_0" | "TIER_1" | "TIER_2" | "TIER_3";
        TenantResponse: {
            /** Format: uuid */
            id: string;
            legalName: string;
            tradingName: string | null;
            tin: string | null;
            rcNumber: string | null;
            phone: string | null;
            email: string | null;
            address: string | null;
            kycTier: components["schemas"]["KycTier"];
            /** Format: uuid */
            defaultVatRuleId: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        UpdateTenantDto: {
            tradingName?: string;
            address?: string;
            /** Format: email */
            email?: string;
        };
        CustomerResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            tenantId: string;
            name: string;
            phone: string | null;
            email: string | null;
            tin: string | null;
            address: string | null;
            isVatRegistered: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateCustomerDto: {
            name: string;
            phone?: string;
            /** Format: email */
            email?: string;
            tin?: string;
            address?: string;
            isVatRegistered?: boolean;
        };
        UpdateCustomerDto: {
            name?: string;
            phone?: string;
            /** Format: email */
            email?: string;
            tin?: string;
            address?: string;
            isVatRegistered?: boolean;
        };
        ProductResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            tenantId: string;
            name: string;
            sku: string | null;
            /** @description kobo */
            unitPriceKobo: string;
            /** Format: uuid */
            taxRuleId: string | null;
            active: boolean;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateProductDto: {
            name: string;
            sku?: string;
            unitPriceKobo: number;
            taxRuleId?: string;
            active?: boolean;
        };
        UpdateProductDto: {
            name?: string;
            sku?: string;
            unitPriceKobo?: number;
            taxRuleId?: string;
            active?: boolean;
        };
        TaxSummaryResponse: {
            invoiceCount: number;
            draftCount: number;
            /** @description kobo */
            subtotalKobo: string;
            /** @description kobo */
            vatKobo: string;
            /** @description kobo */
            whtKobo: string;
            /** @description kobo */
            totalKobo: string;
        };
        /** @enum {string} */
        InvoiceStatus: "DRAFT" | "PENDING_TRANSMISSION" | "TRANSMITTED" | "PART_PAID" | "PAID" | "OVERDUE" | "CANCELLED";
        InvoiceListItemResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            tenantId: string;
            /** Format: uuid */
            customerId: string;
            /** @example INV-000001 */
            number: string | null;
            status: components["schemas"]["InvoiceStatus"];
            /** @description kobo */
            subtotalKobo: string;
            /** @description kobo */
            vatKobo: string;
            /** @description kobo */
            whtKobo: string;
            /** @description kobo */
            totalKobo: string;
            /** @description kobo */
            amountPaidKobo: string;
            /** @example NGN */
            currency: string;
            irn: string | null;
            qrPayload: string | null;
            pdfUrl: string | null;
            notes: string | null;
            /** Format: date-time */
            issuedAt: string | null;
            /** Format: date-time */
            transmittedAt: string | null;
            /** Format: date-time */
            dueAt: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            customer: components["schemas"]["CustomerResponse"];
        };
        InvoiceLineResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            invoiceId: string;
            /** Format: uuid */
            productId: string | null;
            description: string;
            /** @description kobo */
            unitPriceKobo: string;
            quantity: number;
            /** @description kobo */
            lineTotalKobo: string;
            /** Format: uuid */
            taxRuleId: string | null;
            /** @description kobo */
            vatKobo: string;
        };
        /** @enum {string} */
        SubmissionStatus: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "TRANSIENT_FAILED" | "PERMANENT_FAILED" | "DLQ";
        EInvoiceSubmissionResponse: {
            /** Format: uuid */
            id: string;
            provider: string;
            status: components["schemas"]["SubmissionStatus"];
            attempts: number;
            irn: string | null;
            /** Format: date-time */
            lastAttemptAt: string | null;
        };
        InvoiceDetailResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            tenantId: string;
            /** Format: uuid */
            customerId: string;
            /** @example INV-000001 */
            number: string | null;
            status: components["schemas"]["InvoiceStatus"];
            /** @description kobo */
            subtotalKobo: string;
            /** @description kobo */
            vatKobo: string;
            /** @description kobo */
            whtKobo: string;
            /** @description kobo */
            totalKobo: string;
            /** @description kobo */
            amountPaidKobo: string;
            /** @example NGN */
            currency: string;
            irn: string | null;
            qrPayload: string | null;
            pdfUrl: string | null;
            notes: string | null;
            /** Format: date-time */
            issuedAt: string | null;
            /** Format: date-time */
            transmittedAt: string | null;
            /** Format: date-time */
            dueAt: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
            customer: components["schemas"]["CustomerResponse"];
            lines: components["schemas"]["InvoiceLineResponse"][];
            submission: components["schemas"]["EInvoiceSubmissionResponse"] | null;
        };
        InvoiceLineDto: {
            description: string;
            unitPriceKobo: number;
            quantity: number;
            productId?: string;
            taxRuleId?: string;
        };
        CreateInvoiceDto: {
            customerId: string;
            lines: components["schemas"]["InvoiceLineDto"][];
            whtRuleId?: string;
            dueAt?: string;
            notes?: string;
        };
        InvoiceResponse: {
            /** Format: uuid */
            id: string;
            /** Format: uuid */
            tenantId: string;
            /** Format: uuid */
            customerId: string;
            /** @example INV-000001 */
            number: string | null;
            status: components["schemas"]["InvoiceStatus"];
            /** @description kobo */
            subtotalKobo: string;
            /** @description kobo */
            vatKobo: string;
            /** @description kobo */
            whtKobo: string;
            /** @description kobo */
            totalKobo: string;
            /** @description kobo */
            amountPaidKobo: string;
            /** @example NGN */
            currency: string;
            irn: string | null;
            qrPayload: string | null;
            pdfUrl: string | null;
            notes: string | null;
            /** Format: date-time */
            issuedAt: string | null;
            /** Format: date-time */
            transmittedAt: string | null;
            /** Format: date-time */
            dueAt: string | null;
            /** Format: date-time */
            createdAt: string;
            /** Format: date-time */
            updatedAt: string;
        };
        CreateCreditNoteDto: {
            invoiceId: string;
            reason: string;
            totalKobo: number;
        };
        SubscribeDto: {
            /** @enum {string} */
            planCode: "starter" | "growth" | "scale";
        };
        ConnectDto: {
            /** @enum {string} */
            provider: "paystack" | "flutterwave" | "mono" | "quickbooks" | "xero" | "zoho-books" | "sage" | "termii" | "resend" | "posthog" | "sentry";
            config: Record<string, never>;
        };
        IssueKeyDto: {
            name: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    HealthController_live_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    HealthController_ready_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuthController_requestOtp_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RequestOtpDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OtpRequestResponse"];
                };
            };
        };
    };
    AuthController_verifyOtp_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VerifyOtpDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthTokensResponse"];
                };
            };
        };
    };
    AuthController_passwordLogin_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PasswordLoginDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["AuthTokensResponse"];
                };
            };
        };
    };
    AuthController_refresh_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    UsersController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TenantsController_me_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TenantResponse"];
                };
            };
        };
    };
    TenantsController_update_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateTenantDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TenantResponse"];
                };
            };
        };
    };
    CustomersController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponse"][];
                };
            };
        };
    };
    CustomersController_create_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCustomerDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponse"];
                };
            };
        };
    };
    CustomersController_get_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponse"];
                };
            };
        };
    };
    CustomersController_update_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateCustomerDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["CustomerResponse"];
                };
            };
        };
    };
    ProductsController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponse"][];
                };
            };
        };
    };
    ProductsController_create_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateProductDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponse"];
                };
            };
        };
    };
    ProductsController_get_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponse"];
                };
            };
        };
    };
    ProductsController_update_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateProductDto"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ProductResponse"];
                };
            };
        };
    };
    TaxController_rules_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    TaxController_summary_v1: {
        parameters: {
            query?: {
                /** @description ISO date; defaults to the 1st of this month (UTC) */
                from?: string;
                /** @description ISO date; defaults to one month after from */
                to?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["TaxSummaryResponse"];
                };
            };
        };
    };
    InvoicesController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceListItemResponse"][];
                };
            };
        };
    };
    InvoicesController_createDraft_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateInvoiceDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceResponse"];
                };
            };
        };
    };
    InvoicesController_get_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceDetailResponse"];
                };
            };
        };
    };
    InvoicesController_issue_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceResponse"];
                };
            };
        };
    };
    InvoicesController_cancel_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["InvoiceResponse"];
                };
            };
        };
    };
    CreditNotesController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    CreditNotesController_create_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CreateCreditNoteDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EInvoiceController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EInvoiceController_retry_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    EInvoiceController_health_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentsController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PaymentsController_createLink_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WebhooksController_paystack_v1: {
        parameters: {
            query?: never;
            header: {
                "x-paystack-signature": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WhatsappController_verify_v1: {
        parameters: {
            query: {
                "hub.mode": string;
                "hub.verify_token": string;
                "hub.challenge": string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    WhatsappController_receive_v1: {
        parameters: {
            query?: never;
            header: {
                "x-hub-signature-256": string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BillingController_plans_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BillingController_subscription_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    BillingController_subscribe_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SubscribeDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    IntegrationsController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    IntegrationsController_connect_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ConnectDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    IntegrationsController_disconnect_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                provider: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AuditController_list_v1: {
        parameters: {
            query: {
                limit: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicApiController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicApiController_create_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicApiController_get_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    PublicApiController_issue_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApiKeysController_list_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApiKeysController_issue_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["IssueKeyDto"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    ApiKeysController_revoke_v1: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminController_tenants_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminController_dlq_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    AdminController_health_v1: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
}
