/**
 * Balance engine.
 * Net Balance = Total Paid - Total Personal Shares + Settlements Paid - Settlements Received
 * Positive -> member should receive money. Negative -> member owes money.
 * All values are integer minor units (paisa).
 */

export interface BalanceExpense {
  id: string;
  amount_minor: number;
  paid_by: string;
  participants: { member_id: string; share_minor: number }[];
}

export interface BalanceSettlement {
  payer_member_id: string;
  receiver_member_id: string;
  amount_minor: number;
  status: "pending" | "completed";
}

export interface MemberBalance {
  memberId: string;
  paid: number;
  share: number;
  settlementsPaid: number;
  settlementsReceived: number;
  pendingOut: number;
  pendingIn: number;
  /** Net after completed settlements. */
  net: number;
  /** Net if all pending settlements were completed. */
  projectedNet: number;
}

export function computeBalances(
  memberIds: string[],
  expenses: BalanceExpense[],
  settlements: BalanceSettlement[],
): Map<string, MemberBalance> {
  const map = new Map<string, MemberBalance>();
  const get = (id: string) => {
    let b = map.get(id);
    if (!b) {
      b = {
        memberId: id,
        paid: 0,
        share: 0,
        settlementsPaid: 0,
        settlementsReceived: 0,
        pendingOut: 0,
        pendingIn: 0,
        net: 0,
        projectedNet: 0,
      };
      map.set(id, b);
    }
    return b;
  };
  memberIds.forEach(get);

  for (const e of expenses) {
    const shareTotal = e.participants.reduce((a, p) => a + p.share_minor, 0);
    if (shareTotal !== e.amount_minor) {
      throw new Error(`Expense ${e.id} shares (${shareTotal}) do not equal its amount (${e.amount_minor})`);
    }
    get(e.paid_by).paid += e.amount_minor;
    for (const p of e.participants) get(p.member_id).share += p.share_minor;
  }

  for (const s of settlements) {
    if (s.status === "completed") {
      get(s.payer_member_id).settlementsPaid += s.amount_minor;
      get(s.receiver_member_id).settlementsReceived += s.amount_minor;
    } else {
      get(s.payer_member_id).pendingOut += s.amount_minor;
      get(s.receiver_member_id).pendingIn += s.amount_minor;
    }
  }

  for (const b of map.values()) {
    b.net = b.paid - b.share + b.settlementsPaid - b.settlementsReceived;
    b.projectedNet = b.net + b.pendingOut - b.pendingIn;
  }
  return map;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}

/**
 * Greedy minimum-cash-flow: repeatedly match the largest debtor with the largest
 * creditor. Produces at most (n - 1) transfers and settles every balance exactly.
 */
export function simplifyDebts(balances: { memberId: string; net: number }[]): Transfer[] {
  const total = balances.reduce((a, b) => a + b.net, 0);
  if (total !== 0) throw new Error(`Balances do not sum to zero (${total})`);
  const debtors = balances
    .filter((b) => b.net < 0)
    .map((b) => ({ id: b.memberId, amt: -b.net }));
  const creditors = balances
    .filter((b) => b.net > 0)
    .map((b) => ({ id: b.memberId, amt: b.net }));
  const sortDesc = (a: { id: string; amt: number }, b: { id: string; amt: number }) =>
    b.amt - a.amt || a.id.localeCompare(b.id);
  const transfers: Transfer[] = [];
  while (debtors.length && creditors.length) {
    debtors.sort(sortDesc);
    creditors.sort(sortDesc);
    const d = debtors[0];
    const c = creditors[0];
    const amount = Math.min(d.amt, c.amt);
    transfers.push({ from: d.id, to: c.id, amount });
    d.amt -= amount;
    c.amt -= amount;
    if (d.amt === 0) debtors.shift();
    if (c.amt === 0) creditors.shift();
  }
  return transfers;
}
