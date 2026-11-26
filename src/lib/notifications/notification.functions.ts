import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatMoney } from "@/lib/finance/money";
import { renderExpenseHtml, renderDueReminderHtml } from "./email-templates";
import { isResendConfigured } from "./resend-client.server";

const DEFAULT_APP_URL = "https://expense-netlify.vercel.app";

function getBaseAppUrl() {
  return (
    process.env["APP_URL"] ||
    process.env["VITE_APP_URL"] ||
    DEFAULT_APP_URL
  ).replace(/\/$/, "");
}

export interface EmailRecipientResult {
  email: string;
  name: string;
  status: "accepted" | "failed" | "pending";
  emailId?: string;
  error?: string;
}

export interface NotificationDeliveryReport {
  success: boolean;
  totalRecipients: number;
  acceptedCount: number;
  failedCount: number;
  pendingCount: number;
  inAppDeliveredCount: number;
  accepted: EmailRecipientResult[];
  failed: EmailRecipientResult[];
  providerConfigured: boolean;
  summaryMessage: string;
}

/**
 * Dispatches expense notification across channels:
 * 1. In-app notification to all linked members
 * 2. Real transactional email via Resend to all members with valid emails
 */
export const notifyExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      expenseId: string;
      groupId: string;
      sendEmail?: boolean;
      appUrl?: string;
    }) => {
      if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household ID");
      if (!/^[0-9a-f-]{36}$/i.test(d.expenseId)) throw new Error("Invalid expense ID");
      return {
        expenseId: d.expenseId,
        groupId: d.groupId,
        sendEmail: d.sendEmail !== false,
        appUrl: d.appUrl,
      };
    }
  )
  .handler(async ({ data }): Promise<NotificationDeliveryReport> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTrackedEmail } = await import("./email-service.server");

    // 1. Fetch household
    const { data: group, error: groupErr } = await supabaseAdmin
      .from("groups")
      .select("id, name, currency")
      .eq("id", data.groupId)
      .single();
    if (groupErr || !group) throw new Error("Household not found");

    // 2. Fetch expense details
    const { data: expense, error: expErr } = await supabaseAdmin
      .from("expenses")
      .select(`
        id,
        title,
        amount_minor,
        category,
        expense_date,
        expense_time,
        paid_by,
        notes,
        description,
        participants:expense_participants(member_id, share_minor, percentage_bps)
      `)
      .eq("id", data.expenseId)
      .eq("group_id", data.groupId)
      .single();

    if (expErr || !expense) throw new Error("Expense not found");

    // 3. Fetch active household members
    const { data: members, error: memErr } = await supabaseAdmin
      .from("group_members")
      .select("id, user_id, name, email, role, status")
      .eq("group_id", data.groupId)
      .eq("status", "active");

    if (memErr || !members) throw new Error("Failed to load household members");

    const payer = members.find((m) => m.id === expense.paid_by);
    const payerName = payer?.name ?? "A member";
    const amountFormatted = formatMoney(expense.amount_minor, group.currency);
    const appUrl = (data.appUrl || getBaseAppUrl()) + "/expenses";

    let inAppCount = 0;
    const acceptedList: EmailRecipientResult[] = [];
    const failedList: EmailRecipientResult[] = [];
    const resendConfigured = isResendConfigured();

    // 4. In-App Notification Channel: Always deliver to linked user accounts
    for (const member of members) {
      if (member.user_id) {
        try {
          const participant = (expense.participants as { member_id: string; share_minor: number }[] | null)?.find(
            (p) => p.member_id === member.id
          );
          const isPayer = member.id === expense.paid_by;
          const shareText = participant
            ? formatMoney(participant.share_minor, group.currency)
            : isPayer
              ? "You paid total"
              : undefined;

          await supabaseAdmin.from("notifications").insert({
            user_id: member.user_id,
            group_id: data.groupId,
            type: "expense_added",
            title: `New expense: ${expense.title}`,
            body: `${payerName} paid ${amountFormatted}${shareText ? ` · Share: ${shareText}` : ""}`,
            link: "/expenses",
          });
          inAppCount++;
        } catch (e) {
          console.warn(`Could not create in-app notification for ${member.name}:`, e);
        }
      }
    }

    // 5. Email Notification Channel: Send via Resend if enabled
    const emailEligibleMembers = members.filter((m) => !!m.email && m.email.trim().length > 0);

    if (data.sendEmail) {
      for (const member of emailEligibleMembers) {
        const participant = (expense.participants as { member_id: string; share_minor: number }[] | null)?.find(
          (p) => p.member_id === member.id
        );
        const isPayer = member.id === expense.paid_by;
        const shareFormatted = participant
          ? formatMoney(participant.share_minor, group.currency)
          : isPayer
            ? "You paid the total"
            : undefined;

        const { subject, html, text } = renderExpenseHtml({
          householdName: group.name,
          expenseTitle: expense.title,
          category: expense.category,
          amountFormatted,
          paidByName: payerName,
          dateFormatted: expense.expense_date,
          timeFormatted: expense.expense_time?.slice(0, 5),
          memberShareFormatted: shareFormatted,
          notes: expense.notes || expense.description || undefined,
          appUrl,
        });

        const idempotencyKey = `expense-${expense.id}-${member.id}`;

        const result = await sendTrackedEmail({
          groupId: data.groupId,
          recipientEmail: member.email!,
          recipientName: member.name,
          recipientMemberId: member.id,
          subject,
          html,
          text,
          notificationType: "expense_added",
          idempotencyKey,
          metadata: {
            expenseId: expense.id,
            amountMinor: expense.amount_minor,
            category: expense.category,
          },
        });

        if (result.success) {
          acceptedList.push({
            email: member.email!,
            name: member.name,
            status: "accepted",
            emailId: result.resendEmailId,
          });
        } else {
          failedList.push({
            email: member.email!,
            name: member.name,
            status: "failed",
            error: result.error || "Email delivery failed",
          });
        }
      }
    }

    const totalEmails = emailEligibleMembers.length;
    const acceptedCount = acceptedList.length;
    const failedCount = failedList.length;

    let summaryMessage = "";
    if (!resendConfigured) {
      summaryMessage = `In-app alert sent to ${inAppCount} member(s). Real emails were NOT sent because RESEND_API_KEY is not configured in Vercel.`;
    } else if (acceptedCount === totalEmails && totalEmails > 0) {
      summaryMessage = `Successfully delivered email notifications to ${acceptedCount} recipient(s).`;
    } else if (acceptedCount > 0 && failedCount > 0) {
      summaryMessage = `Sent ${acceptedCount} email(s) successfully, but ${failedCount} recipient(s) failed.`;
    } else if (failedCount > 0) {
      summaryMessage = `Email sending failed for all ${failedCount} recipient(s). Check your Resend configuration.`;
    } else {
      summaryMessage = `In-app alerts sent. No members have an email address configured.`;
    }

    return {
      success: acceptedCount > 0 || (failedCount === 0 && inAppCount > 0),
      totalRecipients: totalEmails,
      acceptedCount,
      failedCount,
      pendingCount: 0,
      inAppDeliveredCount: inAppCount,
      accepted: acceptedList,
      failed: failedList,
      providerConfigured: resendConfigured,
      summaryMessage,
    };
  });

/**
 * Dispatches due reminder notification to a debtor:
 * 1. In-app notification
 * 2. Real email via Resend
 */
export const notifyDue = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      groupId: string;
      debtorMemberId: string;
      receiverMemberId: string;
      amountMinor: number;
      notes?: string;
      appUrl?: string;
    }) => {
      if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household ID");
      if (!/^[0-9a-f-]{36}$/i.test(d.debtorMemberId)) throw new Error("Invalid debtor ID");
      if (!/^[0-9a-f-]{36}$/i.test(d.receiverMemberId)) throw new Error("Invalid receiver ID");
      if (d.amountMinor <= 0) throw new Error("Amount must be greater than zero");
      return d;
    }
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTrackedEmail } = await import("./email-service.server");

    // 1. Fetch group
    const { data: group, error: groupErr } = await supabaseAdmin
      .from("groups")
      .select("id, name, currency")
      .eq("id", data.groupId)
      .single();
    if (groupErr || !group) throw new Error("Household not found");

    // 2. Fetch debtor and receiver
    const { data: members, error: memErr } = await supabaseAdmin
      .from("group_members")
      .select("id, user_id, name, email, role, esewa_phone")
      .eq("group_id", data.groupId)
      .in("id", [data.debtorMemberId, data.receiverMemberId]);

    if (memErr || !members) throw new Error("Failed to load members");

    const debtor = members.find((m) => m.id === data.debtorMemberId);
    const receiver = members.find((m) => m.id === data.receiverMemberId);

    if (!debtor) throw new Error("Debtor member not found");
    if (!receiver) throw new Error("Receiver member not found");

    const debtorEmail = debtor.email?.trim().toLowerCase();
    if (!debtorEmail || !debtorEmail.includes("@")) {
      throw new Error(`${debtor.name} does not have a valid email configured`);
    }

    const amountFormatted = formatMoney(data.amountMinor, group.currency);
    const appUrl = (data.appUrl || getBaseAppUrl()) + "/balances";

    // 3. In-App notification
    let inAppDelivered = false;
    if (debtor.user_id) {
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: debtor.user_id,
          group_id: data.groupId,
          type: "due_reminder",
          title: `Payment reminder: ${amountFormatted} due to ${receiver.name}`,
          body: `In ${group.name}. ${receiver.esewa_phone ? `Pay via eSewa: ${receiver.esewa_phone}` : "Please settle up soon."}`,
          link: "/balances",
        });
        inAppDelivered = true;
      } catch (e) {
        console.warn("Could not insert in-app due reminder:", e);
      }
    }

    // 4. Email notification via Resend
    const { subject, html, text } = renderDueReminderHtml({
      householdName: group.name,
      debtorName: debtor.name,
      receiverName: receiver.name,
      amountFormatted,
      receiverEsewa: receiver.esewa_phone,
      notes: data.notes,
      appUrl,
    });

    const idempotencyKey = `due-${data.groupId}-${debtor.id}-${receiver.id}-${data.amountMinor}`;

    const emailResult = await sendTrackedEmail({
      groupId: data.groupId,
      recipientEmail: debtorEmail,
      recipientName: debtor.name,
      recipientMemberId: debtor.id,
      subject,
      html,
      text,
      notificationType: "due_reminder",
      idempotencyKey,
      metadata: {
        debtorMemberId: debtor.id,
        receiverMemberId: receiver.id,
        amountMinor: data.amountMinor,
      },
    });

    const resendConfigured = isResendConfigured();

    return {
      success: emailResult.success,
      status: emailResult.status,
      debtorName: debtor.name,
      debtorEmail,
      amountFormatted,
      resendEmailId: emailResult.resendEmailId,
      error: emailResult.error,
      inAppDelivered,
      providerConfigured: resendConfigured,
      message: emailResult.success
        ? `Payment reminder sent to ${debtor.name} (${debtorEmail}) via Resend!`
        : !resendConfigured
          ? `In-app notification saved, but email could NOT be sent because RESEND_API_KEY is missing in Vercel.`
          : `Failed to deliver email to ${debtor.name}: ${emailResult.error || "Unknown error"}`,
    };
  });

/**
 * Bulk reminder dispatch for all outstanding household dues.
 */
export const notifyAllDues = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      groupId: string;
      dues: { debtorMemberId: string; receiverMemberId: string; amountMinor: number }[];
      appUrl?: string;
    }) => {
      if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household ID");
      if (!Array.isArray(d.dues) || d.dues.length === 0) throw new Error("No dues provided");
      return d;
    }
  )
  .handler(async ({ data }): Promise<NotificationDeliveryReport> => {
    const acceptedList: EmailRecipientResult[] = [];
    const failedList: EmailRecipientResult[] = [];
    let inAppCount = 0;

    for (const due of data.dues) {
      try {
        const res = await notifyDue({
          data: {
            groupId: data.groupId,
            debtorMemberId: due.debtorMemberId,
            receiverMemberId: due.receiverMemberId,
            amountMinor: due.amountMinor,
            appUrl: data.appUrl,
          },
        });

        if (res.inAppDelivered) inAppCount++;

        if (res.success) {
          acceptedList.push({
            email: res.debtorEmail,
            name: res.debtorName,
            status: "accepted",
            emailId: res.resendEmailId,
          });
        } else {
          failedList.push({
            email: res.debtorEmail,
            name: res.debtorName,
            status: "failed",
            error: res.error || "Failed to deliver email",
          });
        }
      } catch (err) {
        failedList.push({
          email: "Unknown",
          name: "Debtor",
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const resendConfigured = isResendConfigured();
    const total = data.dues.length;
    const acceptedCount = acceptedList.length;
    const failedCount = failedList.length;

    let summaryMessage = "";
    if (!resendConfigured) {
      summaryMessage = `In-app alerts sent. Direct emails could NOT be sent because RESEND_API_KEY is not configured in Vercel.`;
    } else if (acceptedCount === total) {
      summaryMessage = `Sent email reminders to all ${acceptedCount} debtor(s) successfully!`;
    } else if (acceptedCount > 0) {
      summaryMessage = `Delivered ${acceptedCount} reminder(s); ${failedCount} failed.`;
    } else {
      summaryMessage = `Failed to send reminders to ${failedCount} debtor(s). Check Resend settings.`;
    }

    return {
      success: acceptedCount > 0,
      totalRecipients: total,
      acceptedCount,
      failedCount,
      pendingCount: 0,
      inAppDeliveredCount: inAppCount,
      accepted: acceptedList,
      failed: failedList,
      providerConfigured: resendConfigured,
      summaryMessage,
    };
  });

/**
 * Fetches recent email delivery audit logs for household administrators.
 */
export const getEmailDeliveryLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { groupId: string; limit?: number }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household ID");
    return { groupId: d.groupId, limit: Math.min(d.limit || 50, 100) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    try {
      const { data: logs, error } = await supabaseAdmin
        .from("email_logs")
        .select("*")
        .eq("group_id", data.groupId)
        .order("created_at", { ascending: false })
        .limit(data.limit);

      if (error) {
        console.warn("[EmailLogs] Query error (run supabase/email_logs.sql if missing):", error.message);
        return {
          logs: [],
          stats: { total: 0, accepted: 0, delivered: 0, bounced: 0, failed: 0, pending: 0 },
          tableMissing: true,
        };
      }

      const list = logs || [];
      const stats = {
        total: list.length,
        accepted: list.filter((l) => l.status === "accepted").length,
        delivered: list.filter((l) => l.status === "delivered").length,
        bounced: list.filter((l) => l.status === "bounced").length,
        failed: list.filter((l) => l.status === "failed").length,
        pending: list.filter((l) => l.status === "pending").length,
      };

      return {
        logs: list,
        stats,
        tableMissing: false,
      };
    } catch (err) {
      console.warn("[EmailLogs] Error fetching logs:", err);
      return {
        logs: [],
        stats: { total: 0, accepted: 0, delivered: 0, bounced: 0, failed: 0, pending: 0 },
        tableMissing: true,
      };
    }
  });

/**
 * Allows administrators to retry sending a previously failed email log.
 */
export const retryEmailLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { logId: string; groupId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household ID");
    if (!/^[0-9a-f-]{36}$/i.test(d.logId)) throw new Error("Invalid log ID");
    return d;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendTrackedEmail } = await import("./email-service.server");

    const { data: log, error } = await supabaseAdmin
      .from("email_logs")
      .select("*")
      .eq("id", data.logId)
      .eq("group_id", data.groupId)
      .single();

    if (error || !log) throw new Error("Email log record not found");

    // Clear previous error and set to pending
    await supabaseAdmin
      .from("email_logs")
      .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
      .eq("id", log.id);

    const retryResult = await sendTrackedEmail({
      groupId: log.group_id,
      recipientEmail: log.recipient_email,
      recipientName: log.recipient_name,
      recipientMemberId: log.recipient_member_id,
      subject: log.subject,
      html: `<p>${log.subject}</p>`,
      notificationType: log.notification_type as "expense_added" | "due_reminder" | "custom",
      idempotencyKey: `retry-${log.id}-${Date.now()}`,
    });

    return {
      success: retryResult.success,
      status: retryResult.status,
      error: retryResult.error,
      message: retryResult.success ? "Email successfully resent!" : `Retry failed: ${retryResult.error}`,
    };
  });
