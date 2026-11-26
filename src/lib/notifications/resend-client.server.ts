import { Resend } from "resend";

let _resendClient: Resend | null = null;

export function getResendApiKey(): string | undefined {
  return (
    process.env["RESEND_API_KEY"] ||
    process.env["VITE_RESEND_API_KEY"] ||
    (typeof import.meta !== "undefined" ? import.meta.env?.VITE_RESEND_API_KEY : undefined)
  );
}

export function getEmailFrom(): string {
  return (
    process.env["EMAIL_FROM"] ||
    process.env["VITE_EMAIL_FROM"] ||
    "Family Expense Tracker <onboarding@resend.dev>"
  );
}

export function isResendConfigured(): boolean {
  const key = getResendApiKey();
  return typeof key === "string" && key.trim().length > 0;
}

export function getResendClient(): Resend {
  const apiKey = getResendApiKey();
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "Missing RESEND_API_KEY. Configure RESEND_API_KEY in Vercel project environment variables to send real emails."
    );
  }

  if (!_resendClient) {
    _resendClient = new Resend(apiKey.trim());
  }
  return _resendClient;
}

/**
 * Strict RFC 5322 compatible email address validation.
 */
export function validateEmailAddress(email: unknown): { valid: boolean; normalized: string; error?: string } {
  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, normalized: "", error: "Email address is required." };
  }

  const normalized = email.trim().toLowerCase();
  
  if (normalized.length > 254) {
    return { valid: false, normalized, error: "Email address is too long (max 254 characters)." };
  }

  // General email pattern with domain validation
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  if (!regex.test(normalized)) {
    return { valid: false, normalized, error: "Invalid email address format." };
  }

  const parts = normalized.split("@");
  if (parts.length !== 2) {
    return { valid: false, normalized, error: "Invalid email address." };
  }

  const [local, domain] = parts;
  if (!local || local.length > 64) {
    return { valid: false, normalized, error: "Local part of email is too long." };
  }
  if (!domain || !domain.includes(".")) {
    return { valid: false, normalized, error: "Email domain must contain a valid top-level domain." };
  }

  return { valid: true, normalized };
}
