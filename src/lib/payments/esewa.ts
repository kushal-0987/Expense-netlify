/** eSewa + WhatsApp helpers (pure, no network). */

/** Normalise a Nepali mobile number to 10 digits (98XXXXXXXX). Returns null if invalid. */
export function normalizeEsewaPhone(raw: string): string | null {
  let v = raw.replace(/[\s-]/g, "");
  if (v.startsWith("+977")) v = v.slice(4);
  else if (v.startsWith("977") && v.length === 13) v = v.slice(3);
  return /^9\d{9}$/.test(v) ? v : null;
}

/** wa.me link; sends straight to the person's WhatsApp when we know their number. */
export function whatsappLink(text: string, phone?: string | null): string {
  const n = phone ? normalizeEsewaPhone(phone) : null;
  return `https://wa.me/${n ? `977${n}` : ""}?text=${encodeURIComponent(text)}`;
}

export interface ReminderInput {
  debtorName: string;
  receiverName: string;
  amountText: string;
  householdName: string;
  receiverEsewa?: string | null;
  receiverHasQr?: boolean;
  link?: string;
}

export function reminderMessage(r: ReminderInput): string {
  const lines = [
    `Hi ${r.debtorName}, a friendly reminder from "${r.householdName}":`,
    `you owe ${r.receiverName} ${r.amountText}.`,
  ];
  if (r.receiverEsewa) lines.push("", `Pay ${r.receiverName} on eSewa: ${r.receiverEsewa}`);
  if (r.receiverHasQr) lines.push(`(eSewa QR is in the app)`);
  if (r.link) lines.push("", `See the details: ${r.link}`);
  return lines.join("\n");
}
