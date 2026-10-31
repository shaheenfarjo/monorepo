import "server-only";

import { createAdminClient } from "@repo/database/admin";
import { createBillingService } from "./billing/service";
import { createSupabaseBillingRepository } from "./billing/supabase";
import { keys } from "./keys";
import { createMockProvider } from "./providers/mock";
import { createStripeProvider } from "./providers/stripe";
import { createWaylProvider } from "./providers/wayl";
import type { PaymentProvider } from "./types";

let provider: PaymentProvider | undefined;

/**
 * The configured payment provider: PAYMENTS_PROVIDER, or Wayl when
 * WAYL_API_TOKEN is set, Stripe when STRIPE_SECRET_KEY is set, otherwise the
 * in-memory mock (development only).
 */
export const getPaymentProvider = (): PaymentProvider => {
  if (provider) {
    return provider;
  }

  const {
    PAYMENTS_PROVIDER,
    STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET,
    WAYL_API_TOKEN,
    WAYL_API_URL,
    WAYL_ENV,
    WAYL_WEBHOOK_SECRET,
  } = keys();
  const detected = STRIPE_SECRET_KEY ? "stripe" : "mock";
  const id = PAYMENTS_PROVIDER ?? (WAYL_API_TOKEN ? "wayl" : detected);

  if (id === "wayl") {
    if (!(WAYL_API_TOKEN && WAYL_WEBHOOK_SECRET)) {
      throw new Error("Wayl requires WAYL_API_TOKEN and WAYL_WEBHOOK_SECRET.");
    }
    provider = createWaylProvider({
      apiKey: WAYL_API_TOKEN,
      baseUrl: WAYL_API_URL,
      environment: WAYL_ENV,
      webhookSecret: WAYL_WEBHOOK_SECRET,
    });
  } else if (id === "stripe") {
    if (!(STRIPE_SECRET_KEY && STRIPE_WEBHOOK_SECRET)) {
      throw new Error(
        "Stripe requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET."
      );
    }
    provider = createStripeProvider({
      apiKey: STRIPE_SECRET_KEY,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/billing`,
      webhookSecret: STRIPE_WEBHOOK_SECRET,
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "No payment provider configured: set the Wayl or Stripe keys (see ARCHITECTURE_AND_INTEGRATIONS.md)."
      );
    }
    provider = createMockProvider();
  }

  return provider;
};

/** Billing service wired to Supabase and the configured provider. */
export const getBilling = () =>
  createBillingService({
    provider: getPaymentProvider(),
    repository: createSupabaseBillingRepository(createAdminClient()),
    webhookUrl: process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/webhooks/payments`
      : undefined,
  });

export type { PaymentRecord } from "./billing/repository";
export type {
  BillingService,
  RenewalInvoice,
  WebhookOutcome,
} from "./billing/service";
