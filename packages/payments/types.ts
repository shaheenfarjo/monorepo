/**
 * Provider-agnostic payment types. Amounts are integers in the currency's
 * minor unit (see money.ts): 25,000 IQD is 25000, 49 SAR is 4900.
 */
export type CurrencyCode = "IQD" | (string & {});

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

/** Methods a hosted checkout may offer; availability depends on the merchant account. */
export type PaymentMethod =
  | "card"
  | "qi-card"
  | "zaincash"
  | "fib"
  | "fastpay"
  | "asiahawala"
  | (string & {});

export type CheckoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "canceled"
  | "expired"
  | "refunded";

export interface LineItem {
  amount: number;
  label: string;
  /** Discounts use "decrease". Defaults to "increase". */
  type?: "increase" | "decrease";
}

export interface CheckoutInput {
  amount: Money;
  /** How long the checkout link stays valid. */
  expiresInMinutes?: number;
  /** Shown on the provider's receipt; defaults to one line for the total. */
  lineItems?: LineItem[];
  /** Where the customer lands after paying. */
  redirectUrl?: string;
  /** Our unique order id; the provider echoes it back in webhooks. */
  referenceId: string;
  /** Where the provider sends status webhooks. */
  webhookUrl?: string;
}

export interface Checkout {
  amount: Money;
  completedAt: string | null;
  paymentMethod: string | null;
  /** The provider's own id for the checkout/order. */
  providerReference: string;
  raw: unknown;
  referenceId: string;
  status: CheckoutStatus;
  /** Hosted checkout page; null when it no longer accepts payment. */
  url: string | null;
}

export interface RefundInput {
  amount: Money;
  /** The provider's id for the checkout (Checkout.providerReference). */
  providerReference?: string;
  reason: string;
  referenceId: string;
}

export interface Refund {
  amount: Money;
  id: string;
  raw: unknown;
  referenceId: string;
  status: "requested" | "refunded" | "rejected" | "canceled";
}

/**
 * A verified webhook. Its status is informational: billing re-reads the
 * checkout from the provider's API before acting on it.
 */
export interface PaymentEvent {
  /** Stable key for this delivery, used for idempotency. */
  eventKey: string;
  provider: string;
  /**
   * The provider's id for the checkout, when the provider can only look it up
   * by its own id (Stripe Checkout Sessions). Wayl looks up by referenceId.
   */
  providerReference?: string;
  raw: unknown;
  referenceId: string;
}

export interface ProviderCapabilities {
  methods: readonly PaymentMethod[];
  /** Can the provider charge a saved payment method automatically? */
  recurring: boolean;
  refunds: boolean;
}

export interface PaymentProvider {
  cancelCheckout: (
    referenceId: string,
    providerReference?: string
  ) => Promise<void>;
  readonly capabilities: ProviderCapabilities;
  createCheckout: (input: CheckoutInput) => Promise<Checkout>;
  /** Reads the checkout back from the provider (the source of truth). */
  getCheckout: (
    referenceId: string,
    providerReference?: string
  ) => Promise<Checkout>;
  readonly id: string;
  /** Verifies the signature over the raw body and normalizes the payload. */
  parseWebhook: (request: {
    headers: Headers;
    rawBody: string;
  }) => Promise<PaymentEvent>;
  refund: (input: RefundInput) => Promise<Refund>;
}

export class PaymentProviderError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "PaymentProviderError";
    this.status = status;
  }
}

export class WebhookVerificationError extends Error {
  constructor(message = "Invalid webhook signature") {
    super(message);
    this.name = "WebhookVerificationError";
  }
}
