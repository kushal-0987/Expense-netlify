import type { Database } from "@/integrations/supabase/types";

type T<N extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][N]["Row"];

export type Group = T<"groups">;
export type GroupSettings = T<"group_settings">;
export type Member = T<"group_members">;
export type ExpenseRow = T<"expenses">;
export type Participant = T<"expense_participants">;
export type Expense = ExpenseRow & { participants: Participant[] };
export type Settlement = T<"settlements">;
export type Profile = T<"profiles">;
export type Notification = T<"notifications">;
export type SplitMethod = Database["public"]["Enums"]["split_method"];
export type GroupRole = Database["public"]["Enums"]["group_role"];
export type MembershipWithGroup = Member & { group: Group | null };
