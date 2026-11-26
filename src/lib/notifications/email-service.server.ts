import { getEmailFrom, getResendClient, isResendConfigured, validateEmailAddress } from "./resend-client.server";
import { isGmailSmtpConfigured, sendViaGmailSmtp } from "./gmail-smtp.server";
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
  provider?: "resend" | "gmail_smtp";
  resendEmailId?: string;
  recipientEmail: string;
  recipientName?: string | null;
  error?: string;
  logId?: string;
}

const RESEND_TIMEOUT_MS = 8000;
const RETRY_DELAYS_SECONDS = [60, 300, 900]; // 1 min, 5 min, 15 min

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function isAnyEmailProviderConfigured(): boolean {
  return isResendConfigured() || isGmailSmtpConfigured();
}

/**
 * Enqueues an email job into the persistent `email_logs` queue without waiting for any email provider.
 * Guaranteed not to throw or block core financial operations.
 */
export async function enqueueEmailJob(params: SendSingleEmailParams): Promise<{
  enqueued: boolean;
  duplicate?: boolean;
  logId?: string;
  error?: string;
}> {
  try {
    const validation = validateEmailAddress(params.recipientEmail);
    if (!validation.valid) {
      const errMsg = validation.error || "Invalid recipient email address.";
      const logId = await recordEmailLog({
        groupId: params.groupId,
        recipientEmail: typeof params.recipientEmail === "string" ? params.recipientEmail : "",
        recipientName: params.recipientName,
        recipientMemberId: params.recipientMemberId,
        notificationId: params.notificationId,
        subject: params.subject,
        notificationType: params.notificationType,
        status: "failed",
        errorMessage: errMsg,
        idempotencyKey: params.idempotencyKey,
        metadata: params.metadata,
      });
      return { enqueued: false, logId, error: errMsg };
    }

    const cleanEmail = validation.normalized;

    // Idempotency check: prevent duplicate queued/sent emails
    if (params.idempotencyKey) {
      const existing = await findExistingEmailLog(params.idempotencyKey);
      if (existing) {
        return { enqueued: false, duplicate: true, logId: existing.id };
      }
    }

    const anyProvider = isAnyEmailProviderConfigured();
    const initialStatus: EmailDeliveryStatus = anyProvider ? "pending" : "failed";
    const initialError = anyProvider
      ? null
      : "No email provider configured (set RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD).";

    const logId = await recordEmailLog({
      groupId: params.groupId,
      recipientEmail: cleanEmail,
      recipientName: params.recipientName,
      recipientMemberId: params.recipientMemberId,
      notificationId: params.notificationId,
      subject: params.subject,
      notificationType: params.notificationType,
      status: initialStatus,
      errorMessage: initialError,
      idempotencyKey: params.idempotencyKey,
      htmlBody: params.html,
      textBody: params.text || null,
      metadata: params.metadata,
    });

    return {
      enqueued: initialStatus === "pending",
      logId,
      error: initialError || undefined,
    };
  } catch (err) {
    console.warn("[EmailQueue] Failed to enqueue email job (financial action unaffected):", err);
    return { enqueued: false, error: "Could not enqueue email job." };
  }
}

/**
 * Attempts delivery via Primary (Resend) -> Fallback (Gmail SMTP).
 * Never exposes sensitive credentials or crashes callers.
 */
export async function attemptProviderDelivery(params: {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  idempotencyKey?: string | null;
}): Promise<{
  success: boolean;
  provider?: "resend" | "gmail_smtp";
  emailId?: string;
  error?: string;
  transientError?: boolean;
}> {
  let resendError: string | undefined;

  // 1. Primary: Resend API
  if (isResendConfigured()) {
    try {
      const resend = getResendClient();
      const fromAddress = getEmailFrom();

      const { data, error } = await withTimeout(
        resend.emails.send({
          from: fromAddress,
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text || undefined,
          headers: params.idempotencyKey ? { "X-Entity-Ref-ID": params.idempotencyKey } : undefined,
        }),
        RESEND_TIMEOUT_MS,
        "Resend API"
      );

      if (!error && data?.id) {
        return {
          success: true,
          provider: "resend",
          emailId: data.id,
        };
      }

      resendError = error?.message || "Resend API rejected request.";
      console.warn(`[EmailService] Resend failed for ${params.to}: ${resendError}`);
    } catch (err) {
      resendError = err instanceof Error ? err.message : "Resend request failed or timed out.";
      console.warn(`[EmailService] Resend exception for ${params.to}: ${resendError}`);
    }
  }

  // 2. Fallback: Gmail SMTP
  if (isGmailSmtpConfigured()) {
    console.info(`[EmailService] Falling back to Gmail SMTP for ${params.to}...`);
    const smtpRes = await sendViaGmailSmtp({
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || undefined,
    });

    if (smtpRes.success) {
      return {
        success: true,
        provider: "gmail_smtp",
        emailId: smtpRes.messageId,
      };
    }

    return {
      success: false,
      error: resendError
        ? `Primary (Resend) failed and Gmail SMTP fallback failed.`
        : smtpRes.error || "Gmail SMTP delivery failed.",
      transientError: true,
    };
  }

  if (!isResendConfigured()) {
    return {
      success: false,
      error: "No email provider configured (set RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD).",
      transientError: false,
    };
  }

  return {
    success: false,
    error: resendError || "Email delivery failed.",
    transientError: true,
  };
}

/**
 * Direct tracked delivery (used by admin on-demand send/retry and queue processor).
 */
export async function sendTrackedEmail(params: SendSingleEmailParams): Promise<SendSingleEmailResult> {
  const validation = validateEmailAddress(params.recipientEmail);
  if (!validation.valid) {
    const errorMsg = validation.error || "Invalid recipient email address.";
    const logId = await recordEmailLog({
      groupId: params.groupId,
      recipientEmail: typeof params.recipientEmail === "string" ? params.recipientEmail : "",
      recipientName: params.recipientName,
      recipientMemberId: params.recipientMemberId,
      notificationId: params.notificationId,
      subject: params.subject,
      notificationType: params.notificationType,
      status: "failed",
      errorMessage: errorMsg,
      idempotencyKey: params.idempotencyKey,
      metadata: params.metadata,
    });

    return {
      success: false,
      status: "failed",
      recipientEmail: validation.normalized || String(params.recipientEmail),
      recipientName: params.recipientName,
      error: errorMsg,
      logId,
    };
  }

  const cleanEmail = validation.normalized;

  if (params.idempotencyKey) {
    const existing = await findExistingEmailLog(params.idempotencyKey);
    if (existing && (existing.status === "accepted" || existing.status === "delivered")) {
      return {
        success: true,
        status: existing.status as EmailDeliveryStatus,
        resendEmailId: existing.resend_email_id || undefined,
        recipientEmail: cleanEmail,
        recipientName: params.recipientName,
        logId: existing.id,
      };
    }
  }

  const logId = await recordEmailLog({
    groupId: params.groupId,
    recipientEmail: cleanEmail,
    recipientName: params.recipientName,
    recipientMemberId: params.recipientMemberId,
    notificationId: params.notificationId,
    subject: params.subject,
    notificationType: params.notificationType,
    status: "pending",
    idempotencyKey: params.idempotencyKey,
    htmlBody: params.html,
    textBody: params.text || null,
    metadata: params.metadata,
  });

  const delivery = await attemptProviderDelivery({
    to: cleanEmail,
    subject: params.subject,
    html: params.html,
    text: params.text,
    idempotencyKey: params.idempotencyKey,
  });

  if (delivery.success) {
    const finalStatus: EmailDeliveryStatus = delivery.provider === "gmail_smtp" ? "delivered" : "accepted";
    if (logId) {
      await updateEmailLog(logId, {
        status: finalStatus,
        provider: delivery.provider,
        resendEmailId: delivery.emailId || null,
        sentAt: new Date().toISOString(),
        ...(finalStatus === "delivered" ? { deliveredAt: new Date().toISOString() } : {}),
      });
    }

    return {
      success: true,
      status: finalStatus,
      provider: delivery.provider,
      resendEmailId: delivery.emailId,
      recipientEmail: cleanEmail,
      recipientName: params.recipientName,
      logId,
    };
  }

  if (logId) {
    await updateEmailLog(logId, {
      status: "failed",
      errorMessage: delivery.error || "Delivery failed.",
    });
  }

  return {
    success: false,
    status: "failed",
    recipientEmail: cleanEmail,
    recipientName: params.recipientName,
    error: delivery.error,
    logId,
  };
}

export function computeNextRetryIso(retryCount: number): string | null {
  if (retryCount >= RETRY_DELAYS_SECONDS.length) return null;
  const delaySec = RETRY_DELAYS_SECONDS[retryCount] ?? 900;
  return new Date(Date.now() + delaySec * 1000).toISOString();
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
  provider?: string | null;
  resendEmailId?: string | null;
  errorMessage?: string | null;
  idempotencyKey?: string | null;
  htmlBody?: string | null;
  textBody?: string | null;
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
        provider: input.provider || null,
        resend_email_id: input.resendEmailId || null,
        error_message: input.errorMessage || null,
        idempotency_key: input.idempotencyKey || null,
        html_body: input.htmlBody || null,
        text_body: input.textBody || null,
        metadata: (input.metadata as any) || {},
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[EmailService] Note: Could not insert email_log record:", error.message);
      return undefined;
    }
    return data?.id;
  } catch (err) {
    console.warn("[EmailService] Database record error:", err);
    return undefined;
  }
}

export async function updateEmailLog(
  logId: string,
  patch: {
    status: EmailDeliveryStatus;
    provider?: string | null;
    resendEmailId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
    deliveredAt?: string | null;
    retryCount?: number;
    nextRetryAt?: string | null;
  }
) {
  try {
    const updateData: Record<string, unknown> = {
      status: patch.status,
      updated_at: new Date().toISOString(),
    };
    if (patch.provider !== undefined) updateData.provider = patch.provider;
    if (patch.resendEmailId !== undefined) updateData.resend_email_id = patch.resendEmailId;
    if (patch.errorMessage !== undefined) updateData.error_message = patch.errorMessage;
    if (patch.sentAt !== undefined) updateData.sent_at = patch.sentAt;
    if (patch.deliveredAt !== undefined) updateData.delivered_at = patch.deliveredAt;
    if (patch.retryCount !== undefined) updateData.retry_count = patch.retryCount;
    if (patch.nextRetryAt !== undefined) updateData.next_retry_at = patch.nextRetryAt;

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
