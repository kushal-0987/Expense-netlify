import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { groupQuery, membershipsQuery, profileQuery, qk, type GroupBundle } from "@/lib/data/queries";
import type { Expense, Member, MembershipWithGroup, Profile } from "@/lib/data/types";
import { computeBalances, type MemberBalance } from "@/lib/finance/balances";
import { formatMoney } from "@/lib/finance/money";
import { permissionsFor, type Permissions } from "@/lib/permissions";

const ACTIVE_KEY = "fet.activeGroup";

interface GroupContextValue extends GroupBundle {
  user: User;
  profile: Profile | null;
  memberships: MembershipWithGroup[];
  me: Member | null;
  isAdmin: boolean;
  can: Permissions;
  balances: Map<string, MemberBalance>;
  activeMembers: Member[];
  memberById: (id: string) => Member | undefined;
  memberName: (id: string) => string;
  fmt: (minor: number, opts?: { signed?: boolean; compact?: boolean }) => string;
  switchGroup: (id: string) => void;
  refresh: () => Promise<void>;
  expenseById: (id: string) => Expense | undefined;
}

const GroupContext = createContext<GroupContextValue | null>(null);

export function useGroup() {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroup must be used inside GroupProvider");
  return ctx;
}

export type GroupGateState =
  | { status: "loading" }
  | { status: "error"; error: unknown; retry: () => void }
  | { status: "empty" }
  | { status: "ready"; value: GroupContextValue };

/** Loads the user's groups and the active group's data. */
export function useGroupLoader(user: User): GroupGateState & { memberships: MembershipWithGroup[] } {
  const queryClient = useQueryClient();
  const memberships = useQuery(membershipsQuery(user.id));
  const profile = useQuery(profileQuery(user.id));
  const [stored, setStored] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStored(window.localStorage.getItem(ACTIVE_KEY));
    setHydrated(true);
  }, []);

  const list = memberships.data ?? [];
  const activeId = useMemo(() => {
    if (!list.length) return null;
    return list.find((m) => m.group_id === stored)?.group_id ?? list[0].group_id;
  }, [list, stored]);

  const group = useQuery({ ...groupQuery(activeId ?? "none"), enabled: !!activeId });

  const switchGroup = useCallback((id: string) => {
    window.localStorage.setItem(ACTIVE_KEY, id);
    setStored(id);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: qk.memberships(user.id) }),
      activeId ? queryClient.invalidateQueries({ queryKey: qk.group(activeId) }) : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: qk.notifications(user.id) }),
    ]);
  }, [queryClient, user.id, activeId]);

  const value = useMemo<GroupContextValue | null>(() => {
    const bundle = group.data;
    if (!bundle) return null;
    const me = bundle.members.find((m) => m.user_id === user.id) ?? null;
    const isAdmin = me?.role === "admin" && me.status === "active";
    const byId = new Map(bundle.members.map((m) => [m.id, m]));
    const expenseMap = new Map(bundle.expenses.map((e) => [e.id, e]));
    let balances: Map<string, MemberBalance>;
    try {
      balances = computeBalances(
        bundle.members.map((m) => m.id),
        bundle.expenses.map((e) => ({
          id: e.id,
          amount_minor: e.amount_minor,
          paid_by: e.paid_by,
          participants: e.participants,
        })),
        bundle.settlements,
      );
    } catch (err) {
      console.error(err);
      balances = computeBalances(bundle.members.map((m) => m.id), [], []);
    }
    return {
      ...bundle,
      user,
      profile: profile.data ?? null,
      memberships: list,
      me,
      isAdmin,
      can: permissionsFor({ isAdmin, userId: user.id, myMemberId: me?.id ?? null, settings: bundle.settings }),
      balances,
      activeMembers: bundle.members.filter((m) => m.status === "active"),
      memberById: (id) => byId.get(id),
      memberName: (id) => byId.get(id)?.name ?? "Former member",
      fmt: (minor, opts) => formatMoney(minor, bundle.group.currency, opts),
      switchGroup,
      refresh,
      expenseById: (id) => expenseMap.get(id),
    };
  }, [group.data, profile.data, list, user, switchGroup, refresh]);

  if (memberships.isError) return { status: "error", error: memberships.error, retry: () => memberships.refetch(), memberships: list };
  if (memberships.isPending || !hydrated) return { status: "loading", memberships: list };
  if (!list.length) return { status: "empty", memberships: list };
  if (group.isError) return { status: "error", error: group.error, retry: () => group.refetch(), memberships: list };
  if (!value) return { status: "loading", memberships: list };
  return { status: "ready", value, memberships: list };
}

export function GroupProvider({ value, children }: { value: GroupContextValue; children: ReactNode }) {
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}
