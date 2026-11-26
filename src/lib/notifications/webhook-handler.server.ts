import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export interface ResendWebhookEvent {
  type: "email.sent" | "email.delivered" | "email.delivery_delayed" | "email.bounced" | "email.complained";
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    bounce?: {
      message?: string;
      type?: string;
      sub_type?: string;
    };
  };
}

/**
 * Verifies the Svix / Resend webhook signature using Node crypto.
 * Resend signs webhooks using Svix standard: svix-id, svix-timestamp, svix-signature.
 */
export function verifyResendWebhookSignature(
  rawBody: string,
  headers: Headers,
  secret: string | undefined
): boolean {
  if (!secret) {
    // If no secret is configured, log warning and allow for development/testing
    console.warn("[Webhook] RESEND_WEBHOOK_SECRET is not configured; skipping signature check.");
    return true;
  }

  const svixId = headers.get("svix-id");
  const svixTimestamp = headers.get("svix-timestamp");
  const svixSignature = headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error("[Webhook] Missing required Svix signature headers.");
    return false;
  }

  // Prevent replay attacks (tolerance: 5 minutes)
  const timestampNum = parseInt(svixTimestamp, 10);
  if (isNaN(timestampNum)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestampNum) > 300) {
    console.error("[Webhook] Webhook timestamp is outside the 5-minute tolerance window.");
    return false;
  }

  try {
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
    const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const secretBuffer = Buffer.from(cleanSecret, "base64");

    const expectedSignature = crypto
      .createHmac("sha256", secretBuffer)
      .update(toSign)
      .digest("base64");

    const passedSignatures = svixSignature.split(" ");
    for (const versionedSig of passedSignatures) {
      const [version, signature] = versionedSig.split(",");
      if (version === "v1" && signature === expectedSignature) {
        return true;
      }
    }

    console.error("[Webhook] Svix signature mismatch.");
    return false;
  } catch (err) {
    console.error("[Webhook] Error calculating webhook signature:", err);
    return false;
  }
}

/**
 * Processes incoming Resend webhook events and updates database delivery state.
 */
export async function handleResendWebhook(rawBody: string, headers: Headers): Promise<{ status: number; body: Record<string, unknown> }> {
  const secret = process.env["RESEND_WEBHOOK_SECRET"] || process.env["VITE_RESEND_WEBHOOK_SECRET"];
  const isValid = verifyResendWebhookSignature(rawBody, headers, secret);

  if (!isValid) {
    return {
      status: 401,
      body: { error: "Invalid webhook signature" },
    };
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "Invalid JSON payload" } };
  }

  if (!event || !event.type || !event.data?.email_id) {
    return { status: 400, body: { error: "Missing event type or email_id" } };
  }

  const emailId = event.data.email_id;
  const eventType = event.type;
  console.info(`[Webhook] Received Resend event "${eventType}" for email ${emailId}`);

  // Map Resend event type to internal delivery status
  let mappedStatus: "accepted" | "delivered" | "delayed" | "bounced" | "failed" | null = null;
  let errorMessage: string | null = null;
  let deliveredAt: string | null = null;

  switch (eventType) {
    case "email.sent":
      mappedStatus = "accepted";
      break;
    case "email.delivered":
      mappedStatus = "delivered";
      deliveredAt = event.created_at || new Date().toISOString();
      break;
    case "email.delivery_delayed":
      mappedStatus = "delayed";
      break;
    case "email.bounced":
      mappedStatus = "bounced";
      errorMessage = event.data.bounce?.message || `Email bounced (${event.data.bounce?.type || "unknown"})`;
      break;
    case "email.complained":
      mappedStatus = "failed";
      errorMessage = "Recipient marked email as spam / complaint received";
      break;
    default:
      console.info(`[Webhook] Unhandled event type: ${eventType}`);
      return { status: 200, body: { received: true, ignored: true } };
  }

  // Update email_logs in Supabase
  try {
    const { data: existing, error: findErr } = await supabaseAdmin
      .from("email_logs")
      .select("id, status, metadata")
      .eq("resend_email_id", emailId)
      .maybeSingle();

    if (findErr) {
      console.warn("[Webhook] Could not query email_logs:", findErr.message);
      return { status: 200, body: { received: true, note: "table_not_found" } };
    }

    if (!existing) {
      console.info(`[Webhook] No local email_log record found for Resend email ${emailId}.`);
      return { status: 200, body: { received: true, not_found: true } };
    }

    // Guard against status regression (e.g. don't overwrite 'delivered' with 'sent')
    if (existing.status === "delivered" && mappedStatus !== "bounced" && mappedStatus !== "failed") {
      console.info(`[Webhook] Email ${emailId} already marked as delivered; ignoring older event ${eventType}.`);
      return { status: 200, body: { received: true, already_delivered: true } };
    }

    const currentMetadata = (existing.metadata as Record<string, unknown>) || {};
    const updatedMetadata = {
      ...currentMetadata,
      lastWebhookEvent: eventType,
      lastWebhookAt: event.created_at || new Date().toISOString(),
    };

    const updatePayload: Record<string, unknown> = {
      status: mappedStatus,
      updated_at: new Date().toISOString(),
      metadata: updatedMetadata,
    };
    if (deliveredAt) updatePayload.delivered_at = deliveredAt;
    if (errorMessage) updatePayload.error_message = errorMessage;

    await supabaseAdmin
      .from("email_logs")
      .update(updatePayload as any)
      .eq("id", existing.id);

    console.info(`[Webhook] Successfully updated email_log ${existing.id} to status "${mappedStatus}".`);
    return { status: 200, body: { received: true, updated: true, status: mappedStatus } };
  } catch (err) {
    console.error("[Webhook] Error updating email status:", err);
    return { status: 500, body: { error: "Database update error" } };
  }
}
