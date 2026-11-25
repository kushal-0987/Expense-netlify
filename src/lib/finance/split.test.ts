import { describe, expect, it } from "vitest";
import { computeShares, evenPercents, type SplitRow } from "./split";

const rows = (ids: string[], patch: Partial<SplitRow>[] = []): SplitRow[] =>
  ids.map((id, i) => ({ memberId: id, included: true, exact: "", percent: "", ...patch[i] }));

describe("computeShares", () => {
  it("equal split of Rs. 3,000 among 3 gives 1,000 each", () => {
    const r = computeShares("equal", 300000, rows(["a", "b", "c"]));
    expect(r.error).toBeNull();
    expect(r.shares.map((s) => s.share_minor)).toEqual([100000, 100000, 100000]);
  });

  it("equal split only uses the people who are ticked", () => {
    const r = computeShares("equal", 1000, rows(["a", "b", "c"], [{}, { included: false }, {}]));
    expect(r.shares.map((s) => s.member_id)).toEqual(["a", "c"]);
    expect(r.shares.map((s) => s.share_minor)).toEqual([500, 500]);
  });

  it("exact amounts must add up to the total", () => {
    const short = computeShares("exact", 100000, rows(["a", "b"], [{ exact: "600" }, { exact: "300" }]));
    expect(short.error).not.toBeNull();
    expect(short.remaining).toBe(10000);
    const ok = computeShares("exact", 100000, rows(["a", "b"], [{ exact: "600" }, { exact: "400" }]));
    expect(ok.error).toBeNull();
    expect(ok.shares.map((s) => s.share_minor)).toEqual([60000, 40000]);
  });

  it("percentages must total 100% and shares sum to the amount", () => {
    expect(computeShares("percentage", 10000, rows(["a", "b"], [{ percent: "50" }, { percent: "40" }])).error).not.toBeNull();
    const r = computeShares("percentage", 100, rows(["a", "b", "c"], [{ percent: "33.33" }, { percent: "33.33" }, { percent: "33.34" }]));
    expect(r.error).toBeNull();
    expect(r.shares.reduce((a, s) => a + s.share_minor, 0)).toBe(100);
  });

  it("individual expense puts the full amount on one person", () => {
    const r = computeShares("individual", 5000, rows(["a", "b"]), "b");
    expect(r.shares).toEqual([{ member_id: "b", share_minor: 5000, percentage_bps: null }]);
  });

  it("even percentages always total exactly 100", () => {
    expect(evenPercents(3)).toEqual(["33.34", "33.33", "33.33"]);
    expect(evenPercents(4)).toEqual(["25.00", "25.00", "25.00", "25.00"]);
  });
});
