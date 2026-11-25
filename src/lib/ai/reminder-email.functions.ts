import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ReminderEmailInput {
  groupId: string;
  debtorName: string;
  receiverName: string;
  amountText: string;
  householdName: string;
  receiverEsewa?: string;
  link?: string;
  tone: "friendly" | "neutral" | "firm";
  notes?: string;
}

const clip = (s: unknown, n: number) => (typeof s === "string" ? s.slice(0, n) : "");

/** Household admins only: AI drafts a personalised reminder email (subject + body). */
export const draftReminderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ReminderEmailInput): ReminderEmailInput => {
    if (!/^[0-9a-f-]{36}$/i.test(d.groupId)) throw new Error("Invalid household");
    const tone = d.tone === "firm" || d.tone === "neutral" ? d.tone : "friendly";
    return {
      groupId: d.groupId,
      debtorName: clip(d.debtorName, 80),
      receiverName: clip(d.receiverName, 80),
      amountText: clip(d.amountText, 40),
      householdName: clip(d.householdName, 80),
      receiverEsewa: clip(d.receiverEsewa, 20),
      link: clip(d.link, 300),
      tone,
      notes: clip(d.notes, 500),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("is_group_admin", { _group_id: data.groupId });
    if (!ok) throw new Error("Only household admins can draft reminders");

    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    const facts = [
      `Recipient (owes money): ${data.debtorName}`,
      `Owed to: ${data.receiverName}`,
      `Amount: ${data.amountText}`,
      `Household: ${data.householdName}`,
      data.receiverEsewa ? `Pay via eSewa number: ${data.receiverEsewa}` : "",
      data.link ? `Link to view details in the app: ${data.link}` : "",
      `Tone: ${data.tone}`,
      data.notes ? `Extra notes from the admin: ${data.notes}` : "",
    ].filter(Boolean).join("\n");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6.1-terra",
        instructions:
          "You write short, clear, polite email reminders for a family expense-sharing app used in Nepal. " +
          "Use only the facts given; never invent amounts, numbers or dates. Keep the body under 140 words, plain text, no markdown. " +
          'Reply with JSON only: {"subject": string, "body": string}.',
        input: facts,
      });
      let text = "";
      for (const item of res.output ?? []) {
        if (item.type === "message") for (const c of item.content) if (c.type === "output_text") text += c.text;
      }
      const m = text.match(/\{[\s\S]*\}/);
      const parsed = m ? (JSON.parse(m[0]) as { subject?: string; body?: string }) : {};
      if (!parsed.body) throw new Error("empty");
      return { subject: parsed.subject || `Reminder: ${data.amountText} to ${data.receiverName}`, body: parsed.body };
    } catch (e) {
      if (e instanceof GatewayError) {
        console.error("draftReminderEmail gateway error", e.code, e.httpStatus);
        if (e.httpStatus === 429) throw new Error("Too many requests right now — try again in a minute.");
        if (e.httpStatus === 402) throw new Error("AI credits have run out for this workspace.");
      } else console.error("draftReminderEmail failed", e);
      throw new Error("Couldn't draft the email right now. Please try again.");
    }
  });
