import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Expense,
  Group,
  GroupSettings,
  Member,
  MembershipWithGroup,
  Notification,
  Profile,
  Settlement,
} from "./types";

const PAGE = 1000;

/** Page through results so groups with >1000 rows still load completely. */
async function fetchAll<R>(
  build: (from: number, to: number) => PromiseLike<{ data: R[] | null; error: unknown }>,
): Promise<R[]> {
  const out: R[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
}

export const qk = {
  memberships: (uid: string) => ["memberships", uid] as const,
  group: (gid: string) => ["group", gid] as const,
  profile: (uid: string) => ["profile", uid] as const,
  notifications: (uid: string) => ["notifications", uid] as const,
};

export const membershipsQuery = (uid: string) =>
  queryOptions({
    queryKey: qk.memberships(uid),
    queryFn: async (): Promise<MembershipWithGroup[]> => {
      // Link any member rows an admin created with this person's email.
      await supabase.rpc("claim_memberships");
      const { data, error } = await supabase
        .from("group_members")
        .select("*, group:groups(*)")
        .eq("user_id", uid)
        .eq("status", "active")
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as MembershipWithGroup[];
    },
  });

export interface GroupBundle {
  group: Group;
  settings: GroupSettings;
  members: Member[];
  expenses: Expense[];
  settlements: Settlement[];
}

export const groupQuery = (gid: string) =>
  queryOptions({
    queryKey: qk.group(gid),
    queryFn: async (): Promise<GroupBundle> => {
      const [g, s, m, e, st] = await Promise.all([
        supabase.from("groups").select("*").eq("id", gid).single(),
        supabase.from("group_settings").select("*").eq("group_id", gid).single(),
        supabase.from("group_members").select("*").eq("group_id", gid).order("joined_at").order("created_at"),
        fetchAll<Expense>((from, to) =>
          supabase
            .from("expenses")
            .select("*, participants:expense_participants(*)")
            .eq("group_id", gid)
            .order("expense_date", { ascending: false })
            .order("expense_time", { ascending: false, nullsFirst: false })
            .order("created_at", { ascending: false })
            .range(from, to) as unknown as PromiseLike<{ data: Expense[] | null; error: unknown }>,
        ),
        fetchAll<Settlement>((from, to) =>
          supabase
            .from("settlements")
            .select("*")
            .eq("group_id", gid)
            .order("settlement_date", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, to),
        ),
      ]);
      if (g.error) throw g.error;
      if (s.error) throw s.error;
      if (m.error) throw m.error;
      return {
        group: g.data,
        settings: s.data,
        members: m.data ?? [],
        expenses: e,
        settlements: st,
      };
    },
  });

export const profileQuery = (uid: string) =>
  queryOptions({
    queryKey: qk.profile(uid),
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const notificationsQuery = (uid: string) =>
  queryOptions({
    queryKey: qk.notifications(uid),
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
  });
