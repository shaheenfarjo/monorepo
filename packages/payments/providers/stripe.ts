import { createHmac, timingSafeEqual } from "node:crypto";
import { currencyDigits } from "../money";
import {
  type Checkout,
  type CheckoutStatus,
  type PaymentEvent,
  type PaymentProvider,
  PaymentProviderError,
  type Refund,
  WebhookVerificationError,
} from "../types";

/**
 * Stripe (https://stripe.com) — hosted Checkout Sessions in payment mode,
 * one per invoice, like Wayl links. Uses the REST API directly, so there is
 * no SDK dependency.
 *
 * Webhooks: add an endpoint in the Stripe dashboard pointing at
 * `<NEXT_PUBLIC_API_URL>/webhooks/payments` for the checkout.session.*
 * events; its signing secret is STRIPE_WEBHOOK_SECRET.
 *
 * Note: Stripe is available to businesses in some countries of the region
 * (e.g. the UAE) but not all; check https://stripe.com/global.
 */

const SIGNATURE_HEADER = "stripe-signature";
const SIGNATURE_TOLERANCE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 15_000;
// Stripe accepts session expiry between 30 minutes and 24 hours.
const MIN_EXPIRY_MINUTES = 30;
const MAX_EXPIRY_MINUTES = 24 * 60;

// https://docs.stripe.com/currencies#zero-decimal and #three-decimal
const ZERO_DECIMAL = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);
const THREE_DECIMAL = new Set(["BHD", "JOD", "KWD", "OMR", "TND"]);

const stripeDigits = (currency: string) => {
  if (ZERO_DECIMAL.has(currency)) {
    return 0;
  }
  return THREE_DECIMAL.has(currency) ? 3 : 2;
};

/** Our minor units (CLDR decimals) → Stripe's (e.g. IQD: 0 → 2 decimals). */
export const toStripeAmount = (amount: number, currency: string) =>
  Math.round(
    amount * 10 ** (stripeDigits(currency) - currencyDigits(currency))
  );

export const fromStripeAmount = (amount: number, currency: string) =>
  Math.round(
    amount / 10 ** (stripeDigits(currency) - currencyDigits(currency))
  );

/** Stripe-Signature: `t=<timestamp>,v1=<hex HMAC of "t.body">` (one or more v1). */
export const verifyStripeSignature = (
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
) => {
  if (!header) {
    return false;
  }
  const parts = header.split(",").map((part) => part.split("=", 2));
  const timestamp = Number(parts.find(([key]) => key === "t")?.[1]);
  const signatures = parts
    .filter(([key]) => key === "v1")
    .map(([, value]) => value ?? "");

  if (
    !Number.isFinite(timestamp) ||
    Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS
  ) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest();

  return signatures.some((signature) => {
    const received = Buffer.from(signature, "hex");
    return (
      received.length === expected.length && timingSafeEqual(received, expected)
    );
  });
};

interface StripeCharge {
  amount_refunded?: number;
  refunded?: boolean;
}

interface StripePaymentIntent {
  id: string;
  latest_charge?: StripeCharge | string | null;
  payment_method_types?: string[];
}

interface StripeSession {
  amount_total: number | null;
  client_reference_id: string | null;
  currency: string | null;
  id: string;
  payment_intent?: StripePaymentIntent | string | null;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired" | null;
  url: string | null;
}

interface StripeRefund {
  amount: number;
  currency: string;
  id: string;
  status: string;
}

const refundStatuses: Record<string, Refund["status"]> = {
  canceled: "canceled",
  failed: "rejected",
  pending: "requested",
  requires_action: "requested",
  succeeded: "refunded",
};

export const toStripeCheckoutStatus = (
  session: StripeSession
): CheckoutStatus => {
  const intent =
    typeof session.payment_intent === "object" ? session.payment_intent : null;
  const charge =
    intent && typeof intent.latest_charge === "object"
      ? intent.latest_charge
      : null;

  if (charge?.refunded) {
    return "refunded";
  }
  if (session.status === "expired") {
    return "expired";
  }
  if (session.status === "complete") {
    // Delayed methods (bank transfers) complete the session before paying.
    return session.payment_status === "unpaid" ? "processing" : "paid";
  }
  return "pending";
};

const toCheckout = (session: StripeSession): Checkout => {
  const currency = (session.currency ?? "").toUpperCase();
  const status = toStripeCheckoutStatus(session);
  const intent =
    typeof session.payment_intent === "object" ? session.payment_intent : null;

  return {
    amount: {
      amount: fromStripeAmount(session.amount_total ?? 0, currency),
      currency,
    },
    completedAt: null,
    paymentMethod: intent?.payment_method_types?.[0] ?? null,
    providerReference: session.id,
    raw: session,
    referenceId: session.client_reference_id ?? "",
    status,
    url: status === "pending" ? session.url : null,
  };
};

/** Stripe's form encoding, with nested keys like `line_items[0][quantity]`. */
const encodeForm = (
  values: Record<string, string | number | undefined>
): string =>
  new URLSearchParams(
    Object.entries(values).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, String(value)]]
    )
  ).toString();

export interface StripeOptions {
  /** Secret key (sk_live_… or sk_test_…). Keep it server-side. */
  apiKey: string;
  baseUrl?: string;
  /** For tests. */
  fetch?: typeof fetch;
  /** Where customers return when the checkout has no redirectUrl (native apps). */
  returnUrl: string;
  /** Endpoint signing secret (whsec_…). */
  webhookSecret: string;
}

export const createStripeProvider = ({
  apiKey,
  baseUrl = "https://api.stripe.com",
  fetch: fetchImpl = fetch,
  returnUrl,
  webhookSecret,
}: StripeOptions): PaymentProvider => {
  const request = async <T>(
    method: "GET" | "POST",
    path: string,
    form?: Record<string, string | number | undefined>
  ) => {
    const response = await fetchImpl(`${baseUrl}/v1${path}`, {
      body: form ? encodeForm(form) : undefined,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(form
          ? { "Content-Type": "application/x-www-form-urlencoded" }
          : {}),
      },
      method,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => ({}))) as T & {
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new PaymentProviderError(
        `Stripe ${method} ${path} failed: ${body.error?.message ?? response.statusText}`,
        response.status
      );
    }
    return body as T;
  };

  const requireSessionId = (providerReference: string | undefined) => {
    if (!providerReference) {
      throw new PaymentProviderError(
        "Stripe needs the Checkout Session id (providerReference)."
      );
    }
    return encodeURIComponent(providerReference);
  };

  const getSession = async (
    referenceId: string,
    providerReference: string | undefined
  ) => {
    const session = await request<StripeSession>(
      "GET",
      `/checkout/sessions/${requireSessionId(providerReference)}?expand[]=payment_intent.latest_charge`
    );
    // The session must belong to this payment, whatever the webhook said.
    if (session.client_reference_id !== referenceId) {
      throw new PaymentProviderError(
        "Checkout Session does not match the payment."
      );
    }
    return session;
  };

  return {
    async cancelCheckout(referenceId, providerReference) {
      const session = await getSession(referenceId, providerReference);
      if (session.status === "open") {
        await request("POST", `/checkout/sessions/${session.id}/expire`, {});
      }
    },

    capabilities: { methods: ["card"], recurring: false, refunds: true },

    async createCheckout(input) {
      const { amount, expiresInMinutes, lineItems, redirectUrl, referenceId } =
        input;
      const currency = amount.currency.toUpperCase();
      if (!Number.isInteger(amount.amount) || amount.amount <= 0) {
        throw new PaymentProviderError("Amount must be a positive integer.");
      }

      const items = (
        lineItems ?? [{ amount: amount.amount, label: "Order" }]
      ).filter((item) => item.type !== "decrease");
      if (items.length !== (lineItems?.length ?? items.length)) {
        throw new PaymentProviderError(
          "Stripe line items can't be negative; use a coupon instead."
        );
      }

      const expiry = Math.min(
        Math.max(expiresInMinutes ?? MAX_EXPIRY_MINUTES, MIN_EXPIRY_MINUTES),
        MAX_EXPIRY_MINUTES
      );
      const form: Record<string, string | number | undefined> = {
        cancel_url: redirectUrl ?? returnUrl,
        client_reference_id: referenceId,
        expires_at: Math.floor(Date.now() / 1000) + expiry * 60,
        "metadata[reference_id]": referenceId,
        mode: "payment",
        "payment_intent_data[metadata][reference_id]": referenceId,
        success_url: redirectUrl ?? returnUrl,
      };
      items.forEach((item, index) => {
        const prefix = `line_items[${index}]`;
        form[`${prefix}[quantity]`] = 1;
        form[`${prefix}[price_data][currency]`] = currency.toLowerCase();
        form[`${prefix}[price_data][unit_amount]`] = toStripeAmount(
          item.amount,
          currency
        );
        form[`${prefix}[price_data][product_data][name]`] = item.label;
      });

      return toCheckout(
        await request<StripeSession>("POST", "/checkout/sessions", form)
      );
    },

    async getCheckout(referenceId, providerReference) {
      return toCheckout(await getSession(referenceId, providerReference));
    },

    id: "stripe",

    parseWebhook({ headers, rawBody }) {
      if (
        !verifyStripeSignature(
          rawBody,
          headers.get(SIGNATURE_HEADER),
          webhookSecret
        )
      ) {
        return Promise.reject(new WebhookVerificationError());
      }

      const event = JSON.parse(rawBody) as {
        data?: { object?: { client_reference_id?: unknown; id?: unknown } };
        id?: unknown;
        type?: unknown;
      };
      const object = event.data?.object;
      if (typeof event.id !== "string") {
        return Promise.reject(new WebhookVerificationError("Event has no id"));
      }

      // Only checkout.session.* events carry our reference; others are
      // recorded and ignored (unknown payment) instead of failing delivery.
      const isSession =
        typeof event.type === "string" &&
        event.type.startsWith("checkout.session.");
      const parsed: PaymentEvent = {
        eventKey: event.id,
        provider: "stripe",
        providerReference:
          isSession && typeof object?.id === "string" ? object.id : undefined,
        raw: event,
        referenceId:
          isSession && typeof object?.client_reference_id === "string"
            ? object.client_reference_id
            : "",
      };
      return Promise.resolve(parsed);
    },

    async refund({ amount, providerReference, reason, referenceId }) {
      const session = await getSession(referenceId, providerReference);
      const intentId =
        typeof session.payment_intent === "object"
          ? session.payment_intent?.id
          : session.payment_intent;
      if (!intentId) {
        throw new PaymentProviderError(
          "This checkout has no payment to refund."
        );
      }
      const currency = amount.currency.toUpperCase();

      const refund = await request<StripeRefund>("POST", "/refunds", {
        amount: toStripeAmount(amount.amount, currency),
        "metadata[reason]": reason.slice(0, 500),
        "metadata[reference_id]": referenceId,
        payment_intent: intentId,
        reason: "requested_by_customer",
      });

      return {
        amount: {
          amount: fromStripeAmount(refund.amount, currency),
          currency,
        },
        id: refund.id,
        raw: refund,
        referenceId,
        status: refundStatuses[refund.status] ?? "requested",
      };
    },
  };
};
