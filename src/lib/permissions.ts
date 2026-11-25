import type { GroupSettings } from "./data/types";

export interface PermissionInput {
  isAdmin: boolean;
  userId: string;
  myMemberId: string | null;
  settings: Pick<
    GroupSettings,
    "members_can_add_expenses" | "members_can_edit_own_expenses" | "members_can_record_settlements"
  >;
}

/**
 * What the signed-in person may do in the current group. Mirrors the checks the
 * database runs, so buttons are hidden when the action would be refused anyway.
 */
export function permissionsFor({ isAdmin, userId, myMemberId, settings }: PermissionInput) {
  const isMine = (e: { created_by: string; paid_by: string }) =>
    e.created_by === userId || (myMemberId !== null && e.paid_by === myMemberId);
  return {
    addExpense: isAdmin || settings.members_can_add_expenses,
    editExpense: (e: { created_by: string; paid_by: string }) =>
      isAdmin || (settings.members_can_edit_own_expenses && isMine(e)),
    recordSettlement: isAdmin || settings.members_can_record_settlements,
    recordSettlementBetween: (payer: string, receiver: string) =>
      isAdmin ||
      (settings.members_can_record_settlements &&
        myMemberId !== null &&
        (payer === myMemberId || receiver === myMemberId)),
    completeSettlement: (s: { status: string; receiver_member_id: string }) =>
      s.status === "pending" && (isAdmin || s.receiver_member_id === myMemberId),
    deleteSettlement: (s: { status: string; created_by: string }) =>
      isAdmin || (s.created_by === userId && s.status === "pending"),
    manageMembers: isAdmin,
    manageSettings: isAdmin,
  };
}

export type Permissions = ReturnType<typeof permissionsFor>;
