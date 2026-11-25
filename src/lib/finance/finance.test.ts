import { describe, expect, it } from "vitest";
import {
  formatMoney,
  parseMoney,
  parsePercent,
  splitByPercentages,
  splitEqual,
  sum,
} from "./money";
import { computeBalances, simplifyDebts } from "./balances";

describe("money", () => {
  it("formats rupees like Rs. 35,844.00", () => {
    expect(formatMoney(3584400)).toBe("Rs. 35,844.00");
    expect(formatMoney(0)).toBe("Rs. 0.00");
    expect(formatMoney(-100050)).toBe("-Rs. 1,000.50");
    expect(formatMoney(12500000)).toBe("Rs. 1,25,000.00");
  });

  it("parses amounts without floating point errors", () => {
    expect(parseMoney("0.1")).toBe(10);
    expect(parseMoney("0.29")).toBe(29);
    expect(parseMoney("1,234.56")).toBe(123456);
    expect(parseMoney("Rs. 3000")).toBe(300000);
    expect(parseMoney("12.345")).toBeNull();
    expect(parseMoney("-5")).toBeNull();
    expect(parseMoney("abc")).toBeNull();
  });

  it("parses percentages to basis points", () => {
    expect(parsePercent("33.33")).toBe(3333);
    expect(parsePercent("100")).toBe(10000);
    expect(parsePercent("100.01")).toBeNull();
  });

  it("splits equally and always sums to the total", () => {
    expect(splitEqual(300000, 3)).toEqual([100000, 100000, 100000]);
    expect(splitEqual(100, 3)).toEqual([34, 33, 33]);
    const shares = splitEqual(1000001, 7);
    expect(sum(shares)).toBe(1000001);
    expect(Math.max(...shares) - Math.min(...shares)).toBeLessThanOrEqual(1);
  });

  it("splits by percentage with largest remainder and sums exactly", () => {
    expect(splitByPercentages(10000, [3333, 3333, 3334])).toEqual([3333, 3333, 3334]);
    const s = splitByPercentages(100, [3333, 3333, 3334]);
    expect(sum(s)).toBe(100);
    expect(splitByPercentages(99999, [5000, 2500, 2500])).toEqual([49999, 25000, 25000]);
    expect(sum(splitByPercentages(99999, [5000, 2500, 2500]))).toBe(99999);
    expect(() => splitByPercentages(100, [5000, 4000])).toThrow();
  });
});

describe("balances", () => {
  const K = "kushal", A = "aarav", S = "sita", R = "ram";

  it("Kushal pays Rs. 3,000 for three: he receives 2,000, others owe 1,000", () => {
    const b = computeBalances(
      [K, A, S],
      [
        {
          id: "e1",
          amount_minor: 300000,
          paid_by: K,
          participants: splitEqual(300000, 3).map((share, i) => ({ member_id: [K, A, S][i], share_minor: share })),
        },
      ],
      [],
    );
    expect(b.get(K)!.net).toBe(200000);
    expect(b.get(A)!.net).toBe(-100000);
    expect(b.get(S)!.net).toBe(-100000);
  });

  it("individual expense paid by the responsible member leaves everyone settled", () => {
    const b = computeBalances([K, A], [{ id: "e", amount_minor: 5000, paid_by: K, participants: [{ member_id: K, share_minor: 5000 }] }], []);
    expect(b.get(K)!.net).toBe(0);
    expect(b.get(A)!.net).toBe(0);
  });

  it("net balances always sum to zero with uneven splits", () => {
    const members = [K, A, S, R];
    const expenses = [
      { id: "1", amount_minor: 100, paid_by: K, participants: splitEqual(100, 3).map((s, i) => ({ member_id: [K, A, S][i], share_minor: s })) },
      { id: "2", amount_minor: 99999, paid_by: A, participants: splitByPercentages(99999, [2500, 2500, 2500, 2500]).map((s, i) => ({ member_id: members[i], share_minor: s })) },
      { id: "3", amount_minor: 4550, paid_by: R, participants: [{ member_id: S, share_minor: 4000 }, { member_id: R, share_minor: 550 }] },
    ];
    const b = computeBalances(members, expenses, []);
    expect(sum([...b.values()].map((x) => x.net))).toBe(0);
  });

  it("completed settlements reduce debt; pending ones only affect the projection", () => {
    const exp = [{ id: "e1", amount_minor: 300000, paid_by: K, participants: [K, A, S].map((m) => ({ member_id: m, share_minor: 100000 })) }];
    const b = computeBalances([K, A, S], exp, [
      { payer_member_id: A, receiver_member_id: K, amount_minor: 100000, status: "completed" },
      { payer_member_id: S, receiver_member_id: K, amount_minor: 40000, status: "pending" },
    ]);
    expect(b.get(A)!.net).toBe(0);
    expect(b.get(K)!.net).toBe(100000);
    expect(b.get(S)!.net).toBe(-100000);
    expect(b.get(S)!.projectedNet).toBe(-60000);
    expect(b.get(K)!.projectedNet).toBe(60000);
  });

  it("rejects expenses whose shares don't add up", () => {
    expect(() => computeBalances([K], [{ id: "x", amount_minor: 100, paid_by: K, participants: [{ member_id: K, share_minor: 99 }] }], [])).toThrow();
  });
});

describe("settlement suggestions", () => {
  it("settles everything with at most n-1 transfers", () => {
    const balances = [
      { memberId: "a", net: 200000 },
      { memberId: "b", net: -100000 },
      { memberId: "c", net: -50000 },
      { memberId: "d", net: -50000 },
      { memberId: "e", net: 0 },
    ];
    const t = simplifyDebts(balances);
    expect(t.length).toBeLessThanOrEqual(4);
    const after = new Map(balances.map((b) => [b.memberId, b.net]));
    for (const x of t) {
      after.set(x.from, after.get(x.from)! + x.amount);
      after.set(x.to, after.get(x.to)! - x.amount);
    }
    expect([...after.values()].every((v) => v === 0)).toBe(true);
  });

  it("collapses a chain a->b->c into a single transfer", () => {
    // a owes b 100, b owes c 100 => a pays c 100
    const t = simplifyDebts([
      { memberId: "a", net: -100 },
      { memberId: "b", net: 0 },
      { memberId: "c", net: 100 },
    ]);
    expect(t).toEqual([{ from: "a", to: "c", amount: 100 }]);
  });

  it("returns nothing when all settled and refuses unbalanced input", () => {
    expect(simplifyDebts([{ memberId: "a", net: 0 }])).toEqual([]);
    expect(() => simplifyDebts([{ memberId: "a", net: 5 }])).toThrow();
  });
});
