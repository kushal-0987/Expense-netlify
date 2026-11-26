import nodemailer from "nodemailer";
import { getEmailFrom } from "./resend-client.server";

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export function getGmailSmtpConfig(): SmtpConfig | null {
  const user = process.env["GMAIL_USER"] || process.env["SMTP_USER"];
  const pass = process.env["GMAIL_APP_PASSWORD"] || process.env["SMTP_PASS"];

  if (!user || !pass || !user.trim() || !pass.trim()) {
    return null;
  }

  const host = process.env["SMTP_HOST"] || "smtp.gmail.com";
  const port = parseInt(process.env["SMTP_PORT"] || "465", 10);
  const secure = port === 465;

  return {
    host: host.trim(),
    port: isNaN(port) ? 465 : port,
    secure,
    user: user.trim(),
    pass: pass.trim(),
  };
}

export function isGmailSmtpConfigured(): boolean {
  return getGmailSmtpConfig() !== null;
}

/**
 * Sends an email via Gmail SMTP with strict timeouts so it never hangs serverless functions.
 * Never leaks SMTP credentials or raw stack traces in returned error messages.
 */
export async function sendViaGmailSmtp(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getGmailSmtpConfig();
  if (!config) {
    return {
      success: false,
      error: "Gmail SMTP fallback is not configured.",
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 7000,
    greetingTimeout: 7000,
    socketTimeout: 9000,
  });

  try {
    const fromHeader = process.env["EMAIL_FROM"] || `Family Expense Tracker <${config.user}>`;
    const info = await transporter.sendMail({
      from: fromHeader || getEmailFrom(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    console.info(`[GmailSMTP] Delivered fallback email to ${params.to} (MessageID: ${info.messageId})`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err) {
    // Log detailed error server-side only; return sanitized message
    console.error("[GmailSMTP] Delivery failed:", err instanceof Error ? err.message : "Unknown SMTP error");
    return {
      success: false,
      error: "Gmail SMTP delivery failed or timed out.",
    };
  } finally {
    try {
      transporter.close();
    } catch {
      // ignore close errors
    }
  }
}
