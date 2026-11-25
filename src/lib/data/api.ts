import type { TablesUpdate } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/lib/categories";
import type { SplitMethod } from "./types";

/** Turn database errors into short, human messages. */
export function errorMessage(err: unknown): string {
  if (!err) return "Something went wrong";
  const e = err as { message?: string; code?: string; details?: string };
  if (e.code === "23503") return "This record is linked to existing transactions and can't be removed.";
  if (e.code === "23505") return "A member with that email already exists in this group.";
  if (e.code === "42501") return e.message && !/permission denied/i.test(e.message) ? e.message : "You don't have permission to do that.";
  return e.message || "Something went wrong";
}

async function rpc<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(errorMessage(error));
  return data as T;
}

export interface ExpenseInput {
  id?: string | null;
  groupId: string;
  title: string;
  description?: string;
  amountMinor: number;
  category: Category;
  date: string;
  time?: string | null;
  paidBy: string;
  splitMethod: SplitMethod;
  notes?: string;
  participants: { member_id: string; share_minor: number; percentage_bps?: number | null }[];
}

export function saveExpense(input: ExpenseInput) {
  return rpc<string>(
    supabase.rpc("save_expense", {
      p_expense_id: input.id ?? (null as unknown as string),
      p_group_id: input.groupId,
      p_title: input.title,
      p_description: input.description ?? "",
      p_amount_minor: input.amountMinor,
      p_category: input.category,
      p_expense_date: input.date,
      p_expense_time: (input.time || null) as unknown as string,
      p_paid_by: input.paidBy,
      p_split_method: input.splitMethod,
      p_notes: input.notes ?? "",
      p_participants: input.participants,
    }),
  );
}

export function deleteExpense(id: string) {
  return rpc(supabase.rpc("delete_expense", { p_expense_id: id }));
}

export function createGroup(name: string, currency = "NPR", memberName?: string) {
  return rpc<string>(
    supabase.rpc("create_group", { p_name: name, p_currency: currency, p_member_name: memberName ?? "" }),
  );
}

export interface SettlementInput {
  groupId: string;
  payer: string;
  receiver: string;
  amountMinor: number;
  date: string;
  notes?: string;
  status?: "pending" | "completed";
}

export function recordSettlement(s: SettlementInput) {
  return rpc<string>(
    supabase.rpc("record_settlement", {
      p_group_id: s.groupId,
      p_payer: s.payer,
      p_receiver: s.receiver,
      p_amount_minor: s.amountMinor,
      p_date: s.date,
      p_notes: s.notes ?? "",
      p_status: s.status ?? "completed",
    }),
  );
}

export function completeSettlement(id: string) {
  return rpc(supabase.rpc("complete_settlement", { p_settlement_id: id }));
}

export function deleteSettlement(id: string) {
  return rpc(supabase.rpc("delete_settlement", { p_settlement_id: id }));
}

export interface MemberInput {
  name: string;
  email?: string | null;
  role: "admin" | "member";
  status?: "active" | "inactive";
  joined_at?: string;
  avatar_url?: string | null;
}

export async function addMember(groupId: string, m: MemberInput) {
  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      name: m.name.trim(),
      email: m.email?.trim() ? m.email.trim().toLowerCase() : null,
      role: m.role,
      status: m.status ?? "active",
      joined_at: m.joined_at,
      avatar_url: m.avatar_url ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(errorMessage(error));
  return data;
}

export async function updateMember(id: string, m: Partial<MemberInput>) {
  const patch: TablesUpdate<"group_members"> = {};
  if (m.name !== undefined) patch.name = m.name.trim();
  if (m.email !== undefined) patch.email = m.email?.trim() ? m.email.trim().toLowerCase() : null;
  if (m.role !== undefined) patch.role = m.role;
  if (m.status !== undefined) patch.status = m.status;
  if (m.joined_at !== undefined) patch.joined_at = m.joined_at;
  if (m.avatar_url !== undefined) patch.avatar_url = m.avatar_url;
  const { error } = await supabase.from("group_members").update(patch).eq("id", id);
  if (error) throw new Error(errorMessage(error));
}

export async function removeMember(id: string) {
  const { error } = await supabase.from("group_members").delete().eq("id", id);
  if (error) throw new Error(errorMessage(error));
}

export async function updateGroup(id: string, patch: { name?: string; currency?: string }) {
  const { error } = await supabase.from("groups").update(patch).eq("id", id);
  if (error) throw new Error(errorMessage(error));
}

export async function deleteGroup(id: string) {
  const { error } = await supabase.from("groups").delete().eq("id", id);
  if (error) throw new Error(errorMessage(error));
}

export async function updateGroupSettings(
  groupId: string,
  patch: Partial<{
    members_can_add_expenses: boolean;
    members_can_edit_own_expenses: boolean;
    members_can_record_settlements: boolean;
    default_split_method: SplitMethod;
  }>,
) {
  const { error } = await supabase.from("group_settings").update(patch).eq("group_id", groupId);
  if (error) throw new Error(errorMessage(error));
}

export async function updateProfile(uid: string, patch: { full_name?: string }) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", uid);
  if (error) throw new Error(errorMessage(error));
}

export async function markNotificationsRead(uid: string, ids?: string[]) {
  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
  if (ids?.length) q = q.in("id", ids);
  const { error } = await q;
  if (error) throw new Error(errorMessage(error));
}

export async function clearNotifications(uid: string) {
  const { error } = await supabase.from("notifications").delete().eq("user_id", uid);
  if (error) throw new Error(errorMessage(error));
}

export async function setMemberPaymentInfo(memberId: string, esewaPhone: string | null, qrPath: string | null) {
  return rpc(
    supabase.rpc("set_member_payment_info", {
      p_member_id: memberId,
      p_esewa_phone: (esewaPhone ?? null) as unknown as string,
      p_qr_path: (qrPath ?? null) as unknown as string,
    }),
  );
}

/** Upload an eSewa QR picture; returns its storage path (<group>/<member>/<file>). */
export async function uploadPaymentQr(groupId: string, memberId: string, file: File) {
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${groupId}/${memberId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("payment-qr").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message || "Could not upload the QR picture");
  return path;
}

export async function removePaymentQr(path: string) {
  await supabase.storage.from("payment-qr").remove([path]);
}
