import { analytics } from "@964reserve/analytics/server";
import { parseError } from "@964reserve/observability/error";
import { log } from "@964reserve/observability/log";
import { payments } from "@964reserve/payments";
import { NextResponse } from "next/server";
import { env } from "@/env";

const COMPLETED_STATUSES = new Set(["Complete", "Delivered"]);
const FAILED_STATUSES = new Set(["Cancelled", "Rejected"]);

/**
 * SECURITY: the payer is identified only from data our own server attached to
 * the link (`customParameter`), re-read from Wayl's API. Nothing that a user
 * can edit (e.g. `user_metadata`) is trusted to attribute a payment.
 */
const getUserIdFromLink = (link: Record<string, unknown>) => {
  if (typeof link.customParameter !== "string") {
    return;
  }

  try {
    const parsed = JSON.parse(link.customParameter) as { userId?: unknown };
    return typeof parsed.userId === "string" ? parsed.userId : undefined;
  } catch {
    // Not JSON, so it was not set by this server.
  }
};

export const POST = async (request: Request): Promise<Response> => {
  if (!(payments && env.WAYL_WEBHOOK_SECRET)) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  // Read the raw bytes exactly as received; the signature covers them.
  const body = await request.text();
  const signature = request.headers.get("x-wayl-signature-256");

  if (!(signature && payments.verifyWebhook(body, signature))) {
    return NextResponse.json(
      { message: "invalid signature", ok: false },
      { status: 401 }
    );
  }

  try {
    const event = JSON.parse(body) as { referenceId?: unknown };

    if (typeof event.referenceId !== "string") {
      return NextResponse.json(
        { message: "missing referenceId", ok: false },
        { status: 400 }
      );
    }

    // Defense in depth: never act on the webhook body alone. Re-fetch the
    // authoritative link state from Wayl's API.
    const link = (await payments.getPaymentStatus(event.referenceId)) as Record<
      string,
      unknown
    >;
    const status = typeof link.status === "string" ? link.status : undefined;
    const userId = getUserIdFromLink(link);

    if (userId && status && COMPLETED_STATUSES.has(status)) {
      analytics?.capture({ distinctId: userId, event: "Payment Complete" });
    } else if (userId && status && FAILED_STATUSES.has(status)) {
      analytics?.capture({ distinctId: userId, event: "Payment Cancelled" });
    } else {
      log.info("Wayl webhook received", {
        referenceId: event.referenceId,
        status,
      });
    }

    await analytics?.shutdown();

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error(parseError(error));

    return NextResponse.json(
      { message: "something went wrong", ok: false },
      { status: 500 }
    );
  }
};
