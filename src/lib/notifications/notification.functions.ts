import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatMoney } from "@/lib/finance/money";
import { renderExpenseHtml, renderDueReminderHtml } from "./email-templates";

const DEFAULT_APP_URL = "https://expense-netlify.vercel.app";

function getBaseAppUrl() {
  return (
    process.env['APP_URL'] ||
    process.env['VITE_APP_URL'] ||
    DEFAULT_APP_URL
  ).replace(/\/$/, "");
}

/**
 * Dispatches push notification and email to all members with a valid email
 * (and household admin) when an expense has been added.
 */
export const notifyExpense = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { expenseId: string; groupId: string; appUrl?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household ID");
    if (!/^[0-9a-f-]{36}$/i.test(d.expenseId)) throw new Error("Invalid expense ID");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail } = await import("./email-service.server");

    // 1. Fetch household info
    const { data: group, error: groupErr } = await supabaseAdmin
      .from("groups")
      .select("id, name, currency")
      .eq("id", data.groupId)
      .single();
    if (groupErr || !group) throw new Error("Household not found");

    // 2. Fetch expense details with participants
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

    // 3. Fetch all active members in this household
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

    // 4. Collect members with valid emails + admins
    const membersWithEmail = members.filter((m) => !!m.email && m.email.includes("@"));
    const notifiedEmails: string[] = [];
    let inAppCount = 0;
    let emailsSentCount = 0;

    for (const member of membersWithEmail) {
      const email = member.email!.trim().toLowerCase();
      if (notifiedEmails.includes(email)) continue;
      notifiedEmails.push(email);

      // Calculate participant share
      const participant = (expense.participants as { member_id: string; share_minor: number }[] | null)?.find(
        (p) => p.member_id === member.id,
      );
      const isPayer = member.id === expense.paid_by;
      const shareFormatted = participant
        ? formatMoney(participant.share_minor, group.currency)
        : isPayer
          ? "You paid the total"
          : undefined;

      // In-app notification for linked user
      if (member.user_id) {
        try {
          await supabaseAdmin.from("notifications").insert({
            user_id: member.user_id,
            group_id: data.groupId,
            type: "expense_added",
            title: `New expense: ${expense.title}`,
            body: `${payerName} paid ${amountFormatted}${shareFormatted ? ` · Your share: ${shareFormatted}` : ""}`,
            link: "/expenses",
          });
          inAppCount++;
        } catch (e) {
          console.error(`Failed to insert in-app notification for user ${member.user_id}:`, e);
        }
      }

      // Email dispatch
      const { subject, html, text } = renderExpenseHtml({
        householdName: group.name,
        expenseTitle: expense.title,
        category: expense.category,
        amountFormatted,
        paidByName: payerName,
        dateFormatted: expense.expense_date,
        memberShareFormatted: shareFormatted,
        notes: expense.notes || expense.description || undefined,
        appUrl,
      });

      const emailResult = await sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      if (emailResult.sent) {
        emailsSentCount++;
      }
    }

    return {
      success: true,
      recipients: notifiedEmails,
      inAppDelivered: inAppCount,
      emailsSent: emailsSentCount,
      totalRecipients: notifiedEmails.length,
      message:
        emailsSentCount > 0
          ? `Notification delivered to ${notifiedEmails.length} member(s) via email and in-app alert.`
          : notifiedEmails.length > 0
            ? `In-app alert created for ${notifiedEmails.length} member(s). Set RESEND_API_KEY in Vercel to also deliver directly to Gmail inboxes.`
            : "No active members currently have an email set.",
    };
  });

/**
 * Dispatches push notification and email reminder when a due is left.
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
    },
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { sendEmail } = await import("./email-service.server");

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

    if (memErr || !members) throw new Error("Failed to load member details");

    const debtor = members.find((m) => m.id === data.debtorMemberId);
    const receiver = members.find((m) => m.id === data.receiverMemberId);

    if (!debtor) throw new Error("Debtor member not found");
    if (!receiver) throw new Error("Receiver member not found");

    const debtorEmail = debtor.email?.trim().toLowerCase();
    if (!debtorEmail || !debtorEmail.includes("@")) {
      throw new Error(`${debtor.name} does not have an email address configured`);
    }

    const amountFormatted = formatMoney(data.amountMinor, group.currency);
    const appUrl = (data.appUrl || getBaseAppUrl()) + "/balances";

    // 3. Create in-app notification for debtor
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
        console.error("Failed to insert in-app reminder:", e);
      }
    }

    // 4. Send email notification
    const { subject, html, text } = renderDueReminderHtml({
      householdName: group.name,
      debtorName: debtor.name,
      receiverName: receiver.name,
      amountFormatted,
      receiverEsewa: receiver.esewa_phone,
      notes: data.notes,
      appUrl,
    });

    const emailResult = await sendEmail({
      to: debtorEmail,
      subject,
      html,
      text,
    });

    return {
      success: true,
      debtorName: debtor.name,
      debtorEmail,
      amountFormatted,
      emailSent: emailResult.sent,
      inAppDelivered,
      message: emailResult.sent
        ? `Payment reminder sent to ${debtor.name} (${debtorEmail})!`
        : `Reminder recorded for ${debtor.name} in-app. Set RESEND_API_KEY in Vercel to also deliver directly to their Gmail inbox.`,
    };
  });

/**
 * Dispatches due reminders in bulk to all members who have outstanding balances.
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
    },
  )
  .handler(async ({ data }) => {
    let notifiedCount = 0;
    const errors: string[] = [];
    const notifiedMembers: string[] = [];

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
        if (res.success) {
          notifiedCount++;
          notifiedMembers.push(`${res.debtorName} (${res.debtorEmail})`);
        }
      } catch (err) {
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }

    return {
      success: true,
      notifiedCount,
      notifiedMembers,
      errors: errors.length > 0 ? errors : undefined,
      message: `Push notification sent to ${notifiedCount} debtor(s) with email!`,
    };
  });
