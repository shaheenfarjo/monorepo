import crypto from "node:crypto";
import { keys } from "./keys";
import type {
  CreatePaymentLinkParams,
  CreateRefundParams,
  CreateSubscriptionParams,
  PaymentLinkResponse,
  PaymentProvider,
  RefundResponse,
} from "./provider";

export class WaylProvider implements PaymentProvider {
  private readonly baseUrl = "https://api.thewayl.com/api/v1";
  private readonly apiToken: string | undefined;
  private readonly webhookSecret: string | undefined;
  private readonly isTestMode: boolean;

  constructor(apiToken?: string, webhookSecret?: string, isTestMode = false) {
    const envKeys = keys();
    this.apiToken = apiToken || envKeys.WAYL_API_TOKEN;
    this.webhookSecret = webhookSecret || envKeys.WAYL_WEBHOOK_SECRET;
    this.isTestMode = isTestMode;
  }

  private async fetchApi(path: string, options: RequestInit = {}) {
    if (!this.apiToken) {
      throw new Error("WAYL_API_TOKEN is not configured.");
    }

    const url = `${this.baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
      "X-WAYL-AUTHENTICATION": this.apiToken,
      ...(options.headers || {}),
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return data;
  }

  async createPaymentLink(
    params: CreatePaymentLinkParams
  ): Promise<PaymentLinkResponse> {
    if (params.currency !== "IQD") {
      throw new Error("Currency must be IQD");
    }
    if (!Number.isInteger(params.total)) {
      throw new Error("Amount must be an integer");
    }

    const payload = {
      currency: "IQD",
      customParameter: params.customParameter || "",
      env: this.isTestMode ? "test" : "live",
      lineItem: params.lineItems,
      redirectionUrl: params.redirectionUrl,
      referenceId: params.referenceId,
      total: params.total,
      webhookSecret: this.webhookSecret,
      // The webhook handler lives in apps/api at /webhooks/payments.
      webhookUrl: process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/webhooks/payments`
        : undefined,
    };

    const response = await this.fetchApi("/links", {
      body: JSON.stringify(payload),
      method: "POST",
    });

    return {
      code: response.data.code,
      id: response.data.id,
      referenceId: response.data.referenceId,
      status: response.data.status,
      url: response.data.url,
    };
  }

  async getPaymentStatus(referenceId: string): Promise<unknown> {
    const response = await this.fetchApi(`/links/${referenceId}`);
    return response.data;
  }

  async createRefund(params: CreateRefundParams): Promise<RefundResponse> {
    const response = await this.fetchApi("/refunds", {
      body: JSON.stringify({
        amount: params.amount,
        reason: params.reason,
        referenceId: params.referenceId,
      }),
      method: "POST",
    });

    return {
      id: response.data.id,
      status: response.data.status,
    };
  }

  verifyWebhook(body: string | Buffer, signature: string): boolean {
    if (!this.webhookSecret) {
      throw new Error("WAYL_WEBHOOK_SECRET is not configured.");
    }
    const calculatedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(body)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const calculatedSignatureBuffer = Buffer.from(calculatedSignature, "hex");

    if (signatureBuffer.length !== calculatedSignatureBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(signatureBuffer, calculatedSignatureBuffer);
  }

  createSubscription(
    params: CreateSubscriptionParams
  ): Promise<PaymentLinkResponse> {
    // Invoice-based subscription: Create a one-off payment link for the first billing cycle
    return this.createPaymentLink({
      currency: "IQD",
      lineItems: [
        {
          amount: params.amount,
          label: "Subscription Start",
          type: "increase",
        },
      ],
      redirectionUrl: params.redirectionUrl,
      referenceId: params.referenceId,
      total: params.amount,
    });
  }

  cancelSubscription(_subscriptionId: string): Promise<void> {
    // Local DB logic only. The provider handles abstraction.
    // In actual implementation, we might not need to do anything with the provider here.
    return Promise.resolve();
  }

  updateSubscription(_subscriptionId: string, _params: unknown): Promise<void> {
    return Promise.resolve();
  }
}
