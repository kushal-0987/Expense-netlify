export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  recipientCount: number;
  provider?: string;
  error?: string;
}

/**
 * Server-side email delivery engine.
 * Supports Resend API (recommended for Vercel/production) and logs delivery fallback.
 */
export async function sendEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validRecipients = recipients
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));

  if (validRecipients.length === 0) {
    return { sent: false, recipientCount: 0, error: "No valid recipient email addresses provided" };
  }

  const resendApiKey =
    process.env['RESEND_API_KEY'] ||
    process.env['VITE_RESEND_API_KEY'] ||
    (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_RESEND_API_KEY : undefined);

  if (resendApiKey) {
    try {
      const fromEmail = process.env['EMAIL_FROM'] || "Family Expense Tracker <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: validRecipients,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          reply_to: payload.replyTo,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("[EmailService] Resend API error:", body);
        return {
          sent: false,
          recipientCount: validRecipients.length,
          provider: "resend",
          error: body?.message || `HTTP ${res.status} from Resend`,
        };
      }

      console.info(`[EmailService] Delivered email to ${validRecipients.join(", ")} via Resend (ID: ${body?.id})`);
      return {
        sent: true,
        messageId: body?.id,
        recipientCount: validRecipients.length,
        provider: "resend",
      };
    } catch (err) {
      console.error("[EmailService] Failed to send via Resend:", err);
      return {
        sent: false,
        recipientCount: validRecipients.length,
        provider: "resend",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // Fallback when RESEND_API_KEY is not configured yet
  console.info(`[EmailService] Push notification recorded for emails: ${validRecipients.join(", ")} (subject: "${payload.subject}"). Add RESEND_API_KEY to send direct inbox emails.`);
  return {
    sent: false,
    recipientCount: validRecipients.length,
    provider: "none",
    error: "No RESEND_API_KEY configured in environment variables",
  };
}
