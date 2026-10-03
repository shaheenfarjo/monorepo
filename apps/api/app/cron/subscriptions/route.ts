import { createAdminClient } from "@964reserve/database";
import { sendEmail } from "@964reserve/email";
import { parseError } from "@964reserve/observability/error";
import { log } from "@964reserve/observability/log";
import { payments } from "@964reserve/payments";
import { NextResponse } from "next/server";
import { isAuthorizedCronRequest, unauthorized } from "@/lib/cron";

// Assuming we have a `subscriptions` table managed via Supabase with fields:
// id, user_id, status, next_billing_date, amount, currency
export const GET = async (request: Request): Promise<Response> => {
  if (!isAuthorizedCronRequest(request)) {
    return unauthorized();
  }

  if (!payments) {
    return NextResponse.json({
      message: "Payments not configured",
      ok: false,
    });
  }

  try {
    const database = createAdminClient();
    const now = new Date().toISOString();

    // Find active subscriptions that are due for renewal
    const { data: dueSubscriptions, error } = await database
      .from("subscriptions")
      .select("*")
      .eq("status", "active")
      .lte("next_billing_date", now);

    if (error) {
      throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    }

    let processed = 0;
    for (const sub of dueSubscriptions || []) {
      try {
        const { data: userResponse } = await database.auth.admin.getUserById(
          sub.user_id
        );
        const user = userResponse?.user;

        if (!user?.email) {
          log.warn(`User ${sub.user_id} not found or has no email.`);
          continue;
        }

        // Generate a new one-off Wayl link for this renewal invoice
        const link = await payments.createPaymentLink({
          currency: "IQD",
          // Read back by the payment webhook to attribute the payment.
          customParameter: JSON.stringify({
            subscriptionId: sub.id,
            userId: sub.user_id,
          }),
          lineItems: [
            {
              amount: sub.amount,
              label: "Subscription Renewal",
              type: "increase",
            },
          ],
          referenceId: `renewal_${sub.id}_${Date.now()}`,
          total: sub.amount,
        });

        // Email the user
        await sendEmail({
          subject: "Your Subscription Renewal is Due",
          text: `Please pay your subscription renewal of ${sub.amount} IQD by visiting: ${link.url}`,
          to: user.email,
        });

        // Update local status to pending payment
        await database
          .from("subscriptions")
          .update({
            latest_invoice_url: link.url,
            status: "pending_payment",
          })
          .eq("id", sub.id);

        processed++;
      } catch (subError) {
        log.error(
          `Failed to process subscription ${sub.id}: ${parseError(subError)}`
        );
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} subscriptions`,
      ok: true,
    });
  } catch (error) {
    log.error(`Cron error: ${parseError(error)}`);
    return NextResponse.json(
      { message: "something went wrong", ok: false },
      { status: 500 }
    );
  }
};
