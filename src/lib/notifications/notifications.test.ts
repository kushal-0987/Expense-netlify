import { describe, expect, it } from "vitest";
import { validateEmailAddress, isResendConfigured, getEmailFrom } from "./resend-client.server";
import { renderExpenseHtml, renderDueReminderHtml } from "./email-templates";
import { verifyResendWebhookSignature } from "./webhook-handler.server";
import crypto from "node:crypto";

describe("Email Address Validation", () => {
  it("accepts valid email addresses and normalizes them", () => {
    const res1 = validateEmailAddress("KushalPokhrel21@gmail.com");
    expect(res1.valid).toBe(true);
    expect(res1.normalized).toBe("kushalpokhrel21@gmail.com");

    const res2 = validateEmailAddress("sareena.ghimire@example.co.uk");
    expect(res2.valid).toBe(true);
    expect(res2.normalized).toBe("sareena.ghimire@example.co.uk");
  });

  it("rejects invalid email formats", () => {
    expect(validateEmailAddress("").valid).toBe(false);
    expect(validateEmailAddress("   ").valid).toBe(false);
    expect(validateEmailAddress("plainaddress").valid).toBe(false);
    expect(validateEmailAddress("@missingusername.com").valid).toBe(false);
    expect(validateEmailAddress("username@.com").valid).toBe(false);
    expect(validateEmailAddress("user@domain").valid).toBe(false);
    expect(validateEmailAddress(null).valid).toBe(false);
    expect(validateEmailAddress(undefined).valid).toBe(false);
  });
});

describe("Resend Configuration Check", () => {
  it("returns default sender when EMAIL_FROM is unset", () => {
    const from = getEmailFrom();
    expect(from).toBeTruthy();
    expect(from).toContain("Family Expense Tracker");
  });

  it("returns false for isResendConfigured when api key is not set", () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.VITE_RESEND_API_KEY;

    expect(isResendConfigured()).toBe(false);

    if (originalKey) process.env.RESEND_API_KEY = originalKey;
  });
});

describe("Branded Email Templates", () => {
  it("renders expense email HTML with all critical elements", () => {
    const { subject, html, text } = renderExpenseHtml({
      householdName: "Pokhrel Household",
      expenseTitle: "Bhatbhateni Groceries",
      category: "groceries",
      amountFormatted: "Rs. 4,500.00",
      paidByName: "Kushal",
      dateFormatted: "2026-11-26",
      memberShareFormatted: "Rs. 2,250.00",
      notes: "Weekly fruits and milk",
      appUrl: "https://expense-netlify.vercel.app/expenses",
    });

    expect(subject).toContain("Pokhrel Household");
    expect(subject).toContain("Bhatbhateni Groceries");
    expect(subject).toContain("Rs. 4,500.00");

    expect(html).toContain("Family Expense Tracker");
    expect(html).toContain("Pokhrel Household");
    expect(html).toContain("Rs. 4,500.00");
    expect(html).toContain("Rs. 2,250.00");
    expect(html).toContain("Kushal");
    expect(html).toContain("Weekly fruits and milk");
    expect(html).toContain("https://expense-netlify.vercel.app/expenses");

    expect(text).toContain("Rs. 4,500.00");
  });

  it("renders due reminder email HTML with eSewa details", () => {
    const { subject, html, text } = renderDueReminderHtml({
      householdName: "Pokhrel Household",
      debtorName: "Sareena",
      receiverName: "Kushal",
      amountFormatted: "Rs. 1,800.00",
      receiverEsewa: "9841234567",
      notes: "Please clear electricity share",
      appUrl: "https://expense-netlify.vercel.app/balances",
    });

    expect(subject).toContain("Payment Reminder");
    expect(subject).toContain("Rs. 1,800.00");
    expect(subject).toContain("Kushal");

    expect(html).toContain("Sareena");
    expect(html).toContain("Rs. 1,800.00");
    expect(html).toContain("9841234567");
    expect(html).toContain("Please clear electricity share");
    expect(html).toContain("https://expense-netlify.vercel.app/balances");

    expect(text).toContain("9841234567");
  });
});

describe("Resend Webhook Signature Verification", () => {
  it("verifies valid Svix signatures correctly", () => {
    const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2TQmuKA";
    const rawSecret = Buffer.from(secret.slice(6), "base64");

    const payload = JSON.stringify({ type: "email.delivered", data: { email_id: "re_123" } });
    const svixId = "msg_2d3f4e5a";
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const toSign = `${svixId}.${svixTimestamp}.${payload}`;

    const sig = crypto.createHmac("sha256", rawSecret).update(toSign).digest("base64");

    const headers = new Headers({
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": `v1,${sig}`,
    });

    const isValid = verifyResendWebhookSignature(payload, headers, secret);
    expect(isValid).toBe(true);
  });

  it("rejects tampered webhook bodies", () => {
    const secret = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2TQmuKA";
    const rawSecret = Buffer.from(secret.slice(6), "base64");

    const payload = JSON.stringify({ type: "email.delivered", data: { email_id: "re_123" } });
    const svixId = "msg_2d3f4e5a";
    const svixTimestamp = String(Math.floor(Date.now() / 1000));
    const toSign = `${svixId}.${svixTimestamp}.${payload}`;

    const sig = crypto.createHmac("sha256", rawSecret).update(toSign).digest("base64");

    const headers = new Headers({
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": `v1,${sig}`,
    });

    // Tampered payload
    const tamperedPayload = JSON.stringify({ type: "email.delivered", data: { email_id: "re_TAMPERED" } });
    const isValid = verifyResendWebhookSignature(tamperedPayload, headers, secret);
    expect(isValid).toBe(false);
  });
});

describe("Email Resilience, Fallback & Retry Controls", () => {
  it("gracefully fails without throwing when both Resend and Gmail SMTP are unavailable", async () => {
    const origResend = process.env.RESEND_API_KEY;
    const origGmailUser = process.env.GMAIL_USER;
    const origGmailPass = process.env.GMAIL_APP_PASSWORD;
    delete process.env.RESEND_API_KEY;
    delete process.env.VITE_RESEND_API_KEY;
    delete process.env.GMAIL_USER;
    delete process.env.GMAIL_APP_PASSWORD;

    const { attemptProviderDelivery } = await import("./email-service.server");
    const { isGmailSmtpConfigured } = await import("./gmail-smtp.server");

    expect(isGmailSmtpConfigured()).toBe(false);

    const res = await attemptProviderDelivery({
      to: "member@example.com",
      subject: "Test resilience",
      html: "<p>Hello</p>",
    });

    expect(res.success).toBe(false);
    expect(res.transientError).toBe(false);
    expect(res.error).toContain("No email provider configured");

    if (origResend) process.env.RESEND_API_KEY = origResend;
    if (origGmailUser) process.env.GMAIL_USER = origGmailUser;
    if (origGmailPass) process.env.GMAIL_APP_PASSWORD = origGmailPass;
  });

  it("caps retries cleanly and prevents infinite retry loops", async () => {
    const { computeNextRetryIso } = await import("./email-service.server");

    expect(computeNextRetryIso(0)).toBeTruthy();
    expect(computeNextRetryIso(1)).toBeTruthy();
    expect(computeNextRetryIso(2)).toBeTruthy();
    expect(computeNextRetryIso(3)).toBeNull();
    expect(computeNextRetryIso(10)).toBeNull();
  });
});
