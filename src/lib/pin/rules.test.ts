import { describe, expect, it } from "vitest";
import { afterFailedAttempt, isLocked, isValidPin } from "./rules";

describe("member PIN rules", () => {
  it("accepts 4 to 6 digits only", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
  });
  it("locks for 15 minutes on the 5th wrong PIN", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(afterFailedAttempt(3, now)).toEqual({ failed_attempts: 4, locked_until: null });
    const r = afterFailedAttempt(4, now);
    expect(r.locked_until).toBe("2026-01-01T00:15:00.000Z");
    expect(isLocked(r.locked_until, new Date("2026-01-01T00:14:00Z"))).toBe(true);
    expect(isLocked(r.locked_until, new Date("2026-01-01T00:16:00Z"))).toBe(false);
  });
});
