import { getEmailFrom, getResendApiKey, getResendClient, isResendConfigured, validateEmailAddress } from "./resend-client.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type EmailDeliveryStatus = "pending" | "accepted" | "delivered" | "delayed" | "bounced" | "failed";

export interface SendSingleEmailParams {
  groupId: string;
  recipientEmail: string;
  recipientName?: string | null;
  recipientMemberId?: string | null;
  notificationId?: string | null;
  subject: string;
  html: string;
  text?: string;
  notificationType: "expense_added" | "due_reminder" | "custom";
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface SendSingleEmailResult {
  success: boolean;
  status: EmailDeliveryStatus;
  resendEmailId?: string;
  recipientEmail: string;
  recipientName?: string | null;
  error?: string;
  logId?: string;
}

/**
 * Sends a transactional email through Resend and tracks delivery state in the database.
 * Compatible with Vercel serverless environments: strictly awaits responses, handles timeouts.
 */
export async function sendTrackedEmail(params: SendSingleEmailParams): Promise<SendSingleEmailResult> {
  const {
    groupId,
    recipientEmail,
    recipientName,
    recipientMemberId,
    notificationId,
    subject,
    html,
    text,
    notificationType,
    idempotencyKey,
    metadata = {},
  } = params;

  // 1. Validate email address
  const validation = validateEmailAddress(recipientEmail);
  if (!validation.valid) {
    const errorMsg = validation.error || "Invalid recipient email address.";
    console.error(`[EmailService] Validation failed for "${recipientEmail}":`, errorMsg);

    const logId = await recordEmailLog({
      groupId,
      recipientEmail: typeof recipientEmail === "string" ? recipientEmail : "",
      recipientName,
      recipientMemberId,
      notificationId,
      subject,
      notificationType,
      status: "failed",
      errorMessage: errorMsg,
      idempotencyKey,
      metadata,
    });

    return {
      success: false,
      status: "failed",
      recipientEmail: validation.normalized || String(recipientEmail),
      recipientName,
      error: errorMsg,
      logId,
    };
  }

  const cleanEmail = validation.normalized;

  // 2. Check idempotency: If this exact key was already accepted/delivered, avoid duplicate sending
  if (idempotencyKey) {
    const existing = await findExistingEmailLog(idempotencyKey);
    if (existing && (existing.status === "accepted" || existing.status === "delivered")) {
      console.info(`[EmailService] Idempotency hit: email already processed (${existing.resend_email_id}) for key ${idempotencyKey}`);
      return {
        success: true,
        status: existing.status as EmailDeliveryStatus,
        resendEmailId: existing.resend_email_id || undefined,
        recipientEmail: cleanEmail,
        recipientName,
        logId: existing.id,
      };
    }
  }

  // 3. Check Resend configuration
  if (!isResendConfigured()) {
    const errorMsg = "RESEND_API_KEY is not configured on the server. Add RESEND_API_KEY in Vercel Environment Variables.";
    console.warn(`[EmailService] Skipping email delivery: ${errorMsg}`);

    const logId = await recordEmailLog({
      groupId,
      recipientEmail: cleanEmail,
      recipientName,
      recipientMemberId,
      notificationId,
      subject,
      notificationType,
      status: "failed",
      errorMessage: errorMsg,
      idempotencyKey,
      metadata: { ...metadata, missingConfig: "RESEND_API_KEY" },
    });

    return {
      success: false,
      status: "failed",
      recipientEmail: cleanEmail,
      recipientName,
      error: errorMsg,
      logId,
    };
  }

  // 4. Record initial pending log in database
  const logId = await recordEmailLog({
    groupId,
    recipientEmail: cleanEmail,
    recipientName,
    recipientMemberId,
    notificationId,
    subject,
    notificationType,
    status: "pending",
    idempotencyKey,
    metadata,
  });

  // 5. Send via Resend SDK
  try {
    const resend = getResendClient();
    const fromAddress = getEmailFrom();

    console.info(`[EmailService] Sending email to ${cleanEmail} (Subject: "${subject}") via Resend...`);

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: cleanEmail,
      subject,
      html,
      text: text || undefined,
      headers: idempotencyKey ? { "X-Entity-Ref-ID": idempotencyKey } : undefined,
    });

    if (error || !data) {
      const errorMsg = error?.message || "Resend API rejected the request.";
      console.error(`[EmailService] Resend API error for ${cleanEmail}:`, error);

      if (logId) {
        await updateEmailLog(logId, {
          status: "failed",
          errorMessage: errorMsg,
        });
      }

      return {
        success: false,
        status: "failed",
        recipientEmail: cleanEmail,
        recipientName,
        error: errorMsg,
        logId,
      };
    }

    // 6. Successfully accepted by Resend
    console.info(`[EmailService] Email accepted by Resend: ID ${data.id} for recipient ${cleanEmail}`);

    if (logId) {
      await updateEmailLog(logId, {
        status: "accepted",
        resendEmailId: data.id,
        sentAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      status: "accepted",
      resendEmailId: data.id,
      recipientEmail: cleanEmail,
      recipientName,
      logId,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[EmailService] Exception calling Resend API for ${cleanEmail}:`, err);

    if (logId) {
      await updateEmailLog(logId, {
        status: "failed",
        errorMessage: errorMsg,
      });
    }

    return {
      success: false,
      status: "failed",
      recipientEmail: cleanEmail,
      recipientName,
      error: errorMsg,
      logId,
    };
  }
}

// ---------------- Database Helper Functions ----------------

interface RecordEmailLogInput {
  groupId: string;
  recipientEmail: string;
  recipientName?: string | null;
  recipientMemberId?: string | null;
  notificationId?: string | null;
  subject: string;
  notificationType: string;
  status: EmailDeliveryStatus;
  resendEmailId?: string | null;
  errorMessage?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
}

async function recordEmailLog(input: RecordEmailLogInput): Promise<string | undefined> {
  try {
    const { data, error } = await supabaseAdmin
      .from("email_logs")
      .insert({
        group_id: input.groupId,
        recipient_email: input.recipientEmail,
        recipient_name: input.recipientName || null,
        recipient_member_id: input.recipientMemberId || null,
        notification_id: input.notificationId || null,
        subject: input.subject,
        notification_type: input.notificationType,
        status: input.status,
        resend_email_id: input.resendEmailId || null,
        error_message: input.errorMessage || null,
        idempotency_key: input.idempotencyKey || null,
        metadata: (input.metadata as any) || {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[EmailService] Note: Could not insert email_log record (run supabase/email_logs.sql if table is missing):", error.message);
      return undefined;
    }
    return data?.id;
  } catch (err) {
    console.warn("[EmailService] Database record error:", err);
    return undefined;
  }
}

async function updateEmailLog(
  logId: string,
  patch: {
    status: EmailDeliveryStatus;
    resendEmailId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
    deliveredAt?: string | null;
  }
) {
  try {
    const updateData: Record<string, unknown> = {
      status: patch.status,
      updated_at: new Date().toISOString(),
    };
    if (patch.resendEmailId !== undefined) updateData.resend_email_id = patch.resendEmailId;
    if (patch.errorMessage !== undefined) updateData.error_message = patch.errorMessage;
    if (patch.sentAt !== undefined) updateData.sent_at = patch.sentAt;
    if (patch.deliveredAt !== undefined) updateData.delivered_at = patch.deliveredAt;

    await supabaseAdmin
      .from("email_logs")
      .update(updateData as any)
      .eq("id", logId);
  } catch (err) {
    console.warn("[EmailService] Could not update email_log:", err);
  }
}

async function findExistingEmailLog(idempotencyKey: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("email_logs")
      .select("id, status, resend_email_id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
