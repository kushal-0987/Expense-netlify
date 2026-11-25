import { describe, expect, it } from "vitest";
import { permissionsFor } from "./permissions";

const open = {
  members_can_add_expenses: true,
  members_can_edit_own_expenses: true,
  members_can_record_settlements: true,
};
const locked = {
  members_can_add_expenses: false,
  members_can_edit_own_expenses: false,
  members_can_record_settlements: false,
};

describe("group permissions", () => {
  it("admins can do everything even when members are locked down", () => {
    const p = permissionsFor({ isAdmin: true, userId: "u1", myMemberId: "m1", settings: locked });
    expect(p.addExpense).toBe(true);
    expect(p.editExpense({ created_by: "other", paid_by: "m2" })).toBe(true);
    expect(p.recordSettlementBetween("m2", "m3")).toBe(true);
    expect(p.manageMembers).toBe(true);
  });

  it("members can only edit expenses they created or paid for", () => {
    const p = permissionsFor({ isAdmin: false, userId: "u1", myMemberId: "m1", settings: open });
    expect(p.editExpense({ created_by: "u1", paid_by: "m2" })).toBe(true);
    expect(p.editExpense({ created_by: "u9", paid_by: "m1" })).toBe(true);
    expect(p.editExpense({ created_by: "u9", paid_by: "m2" })).toBe(false);
    expect(p.manageMembers).toBe(false);
  });

  it("members lose add/edit/settle rights when the admin turns them off", () => {
    const p = permissionsFor({ isAdmin: false, userId: "u1", myMemberId: "m1", settings: locked });
    expect(p.addExpense).toBe(false);
    expect(p.editExpense({ created_by: "u1", paid_by: "m1" })).toBe(false);
    expect(p.recordSettlementBetween("m1", "m2")).toBe(false);
  });

  it("members can only record settlements they are part of", () => {
    const p = permissionsFor({ isAdmin: false, userId: "u1", myMemberId: "m1", settings: open });
    expect(p.recordSettlementBetween("m1", "m2")).toBe(true);
    expect(p.recordSettlementBetween("m2", "m1")).toBe(true);
    expect(p.recordSettlementBetween("m2", "m3")).toBe(false);
  });

  it("only the receiver or an admin confirms a pending settlement", () => {
    const p = permissionsFor({ isAdmin: false, userId: "u1", myMemberId: "m1", settings: open });
    expect(p.completeSettlement({ status: "pending", receiver_member_id: "m1" })).toBe(true);
    expect(p.completeSettlement({ status: "pending", receiver_member_id: "m2" })).toBe(false);
    expect(p.completeSettlement({ status: "completed", receiver_member_id: "m1" })).toBe(false);
  });

  it("members can delete only their own pending settlements", () => {
    const p = permissionsFor({ isAdmin: false, userId: "u1", myMemberId: "m1", settings: open });
    expect(p.deleteSettlement({ status: "pending", created_by: "u1" })).toBe(true);
    expect(p.deleteSettlement({ status: "completed", created_by: "u1" })).toBe(false);
    expect(p.deleteSettlement({ status: "pending", created_by: "u2" })).toBe(false);
  });
});
