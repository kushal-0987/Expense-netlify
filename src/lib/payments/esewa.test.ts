import { describe, expect, it } from "vitest";
import { normalizeEsewaPhone, reminderMessage, whatsappLink } from "./esewa";

describe("eSewa phone number", () => {
  it("accepts 10-digit Nepali mobile numbers starting with 9", () => {
    expect(normalizeEsewaPhone("9841234567")).toBe("9841234567");
    expect(normalizeEsewaPhone("984-123 4567")).toBe("9841234567");
    expect(normalizeEsewaPhone("+9779841234567")).toBe("9841234567");
  });
  it("rejects numbers that are not Nepali mobiles", () => {
    expect(normalizeEsewaPhone("8841234567")).toBeNull();
    expect(normalizeEsewaPhone("984123456")).toBeNull();
    expect(normalizeEsewaPhone("98412345678")).toBeNull();
  });
});

describe("WhatsApp reminder", () => {
  it("sends directly to the debtor's number with the 977 country code", () => {
    expect(whatsappLink("hi", "9841234567")).toBe("https://wa.me/9779841234567?text=hi");
  });
  it("lets the sender pick a chat when the number is unknown", () => {
    expect(whatsappLink("hi", null)).toBe("https://wa.me/?text=hi");
  });
  it("includes the receiver's eSewa number in the message", () => {
    const msg = reminderMessage({ debtorName: "Aarav", receiverName: "Rohan", amountText: "Rs. 1,200", householdName: "Home", receiverEsewa: "9801112222" });
    expect(msg).toContain("Rs. 1,200");
    expect(msg).toContain("9801112222");
  });
});
