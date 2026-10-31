import { createHmac } from "node:crypto";
import { describe, expect, test, vi } from "vitest";
import { PaymentProviderError, WebhookVerificationError } from "../types";
import {
  createStripeProvider,
  fromStripeAmount,
  toStripeAmount,
  verifyStripeSignature,
} from "./stripe";

const secret = "whsec_test";

const sign = (body: string, timestamp: number, key = secret) =>
  `t=${timestamp},v1=${createHmac("sha256", key).update(`${timestamp}.${body}`).digest("hex")}`;

const session = {
  amount_total: 4900,
  client_reference_id: "pay_1",
  currency: "sar",
  id: "cs_test_1",
  payment_intent: null,
  payment_status: "unpaid",
  status: "open",
  url: "https://checkout.stripe.com/c/pay/cs_test_1",
};

const respond = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(Response.json(body, { status }));

const provider = (fetchMock: ReturnType<typeof vi.fn>) =>
  createStripeProvider({
    apiKey: "sk_test_123",
    fetch: fetchMock as unknown as typeof fetch,
    returnUrl: "https://app.example.sa/billing",
    webhookSecret: secret,
  });

describe("Stripe amounts", () => {
  test("converts our minor units to Stripe's", () => {
    expect(toStripeAmount(4900, "SAR")).toBe(4900);
    expect(toStripeAmount(9000, "JOD")).toBe(9000);
    // IQD has no minor unit for us but two decimals for Stripe.
    expect(toStripeAmount(25_000, "IQD")).toBe(2_500_000);
    expect(fromStripeAmount(2_500_000, "IQD")).toBe(25_000);
  });
});

describe("Stripe signatures", () => {
  const body = '{"id":"evt_1"}';
  const now = 1_800_000_000;

  test("accepts a valid, recent signature", () => {
    expect(verifyStripeSignature(body, sign(body, now), secret, now)).toBe(
      true
    );
  });

  test("rejects other secrets, bodies and stale timestamps", () => {
    expect(
      verifyStripeSignature(body, sign(body, now, "whsec_other"), secret, now)
    ).toBe(false);
    expect(
      verifyStripeSignature(`${body} `, sign(body, now), secret, now)
    ).toBe(false);
    expect(
      verifyStripeSignature(body, sign(body, now - 600), secret, now)
    ).toBe(false);
    expect(verifyStripeSignature(body, null, secret, now)).toBe(false);
  });
});

describe("Stripe provider", () => {
  test("creates a Checkout Session for the payment", async () => {
    const fetchMock = respond(200, session);

    const checkout = await provider(fetchMock).createCheckout({
      amount: { amount: 4900, currency: "SAR" },
      lineItems: [{ amount: 4900, label: "Pro plan" }],
      referenceId: "pay_1",
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const form = new URLSearchParams(init.body as string);
    expect(url).toBe("https://api.stripe.com/v1/checkout/sessions");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer sk_test_123"
    );
    expect(form.get("mode")).toBe("payment");
    expect(form.get("client_reference_id")).toBe("pay_1");
    expect(form.get("line_items[0][price_data][currency]")).toBe("sar");
    expect(form.get("line_items[0][price_data][unit_amount]")).toBe("4900");
    // Without a redirect (native apps), customers return to the app.
    expect(form.get("success_url")).toBe("https://app.example.sa/billing");
    expect(checkout).toMatchObject({
      amount: { amount: 4900, currency: "SAR" },
      providerReference: "cs_test_1",
      referenceId: "pay_1",
      status: "pending",
      url: session.url,
    });
  });

  test("reads the session back and maps its status", async () => {
    const paid = {
      ...session,
      payment_intent: {
        id: "pi_1",
        latest_charge: { refunded: false },
        payment_method_types: ["card"],
      },
      payment_status: "paid",
      status: "complete",
    };
    const checkout = await provider(respond(200, paid)).getCheckout(
      "pay_1",
      "cs_test_1"
    );
    expect(checkout).toMatchObject({
      paymentMethod: "card",
      status: "paid",
      url: null,
    });

    const refunded = await provider(
      respond(200, {
        ...paid,
        payment_intent: {
          ...paid.payment_intent,
          latest_charge: { refunded: true },
        },
      })
    ).getCheckout("pay_1", "cs_test_1");
    expect(refunded.status).toBe("refunded");
  });

  test("refuses a session that belongs to another payment", async () => {
    await expect(
      provider(respond(200, session)).getCheckout("pay_other", "cs_test_1")
    ).rejects.toThrow(PaymentProviderError);
    await expect(
      provider(respond(200, session)).getCheckout("pay_1")
    ).rejects.toThrow("Checkout Session id");
  });

  test("parses checkout.session events and ignores others", async () => {
    const now = Math.floor(Date.now() / 1000);
    const event = JSON.stringify({
      data: { object: { client_reference_id: "pay_1", id: "cs_test_1" } },
      id: "evt_1",
      type: "checkout.session.completed",
    });
    const headers = new Headers({ "stripe-signature": sign(event, now) });

    await expect(
      provider(vi.fn()).parseWebhook({ headers, rawBody: event })
    ).resolves.toMatchObject({
      eventKey: "evt_1",
      provider: "stripe",
      providerReference: "cs_test_1",
      referenceId: "pay_1",
    });

    const other = JSON.stringify({
      data: { object: { id: "ch_1" } },
      id: "evt_2",
      type: "charge.succeeded",
    });
    await expect(
      provider(vi.fn()).parseWebhook({
        headers: new Headers({ "stripe-signature": sign(other, now) }),
        rawBody: other,
      })
    ).resolves.toMatchObject({ referenceId: "" });

    await expect(
      provider(vi.fn()).parseWebhook({
        headers: new Headers({ "stripe-signature": "t=1,v1=00" }),
        rawBody: event,
      })
    ).rejects.toThrow(WebhookVerificationError);
  });
});
