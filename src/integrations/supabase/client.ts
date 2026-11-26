// Independent local database & authentication engine
// Replaces external cloud dependency with clean local persistence and instant Google & Admin Auth.

import type { User as SupabaseUser, Session as SupabaseSession } from "@supabase/supabase-js";

type User = SupabaseUser & {
  password?: string;
};

type Session = SupabaseSession;

const STORAGE_KEYS = {
  DB: "@family_expense_local_db_v3",
  SESSION: "@family_expense_session_v3",
};

interface LocalDB {
  users: User[];
  profiles: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  }>;
  groups: Array<{
    id: string;
    name: string;
    currency: string;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
  group_settings: Array<{
    id: string;
    group_id: string;
    members_can_add_expenses: boolean;
    members_can_edit_own_expenses: boolean;
    members_can_record_settlements: boolean;
    require_approval: boolean;
    created_at: string;
    updated_at: string;
  }>;
  group_members: Array<{
    id: string;
    group_id: string;
    user_id: string | null;
    name: string;
    email: string | null;
    role: "admin" | "member";
    status: "active" | "inactive";
    esewa_phone: string | null;
    esewa_qr_path: string | null;
    pin_hash: string | null;
    joined_at: string;
    created_at: string;
    updated_at: string;
  }>;
  expenses: Array<{
    id: string;
    group_id: string;
    title: string;
    description: string | null;
    amount_minor: number;
    category: string;
    expense_date: string;
    expense_time: string | null;
    paid_by: string;
    split_method: string;
    notes: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
  expense_participants: Array<{
    id: string;
    expense_id: string;
    member_id: string;
    share_minor: number;
    percentage_bps: number | null;
    created_at: string;
  }>;
  settlements: Array<{
    id: string;
    group_id: string;
    payer_member_id: string;
    receiver_member_id: string;
    amount_minor: number;
    settlement_date: string;
    notes: string | null;
    status: "pending" | "completed";
    created_by: string;
    created_at: string;
    updated_at: string;
  }>;
  notifications: Array<{
    id: string;
    user_id: string;
    title: string;
    body: string;
    read: boolean;
    created_at: string;
  }>;
}

const DEFAULT_ADMIN_ID = "u_kushal_admin_01";
const DEFAULT_GROUP_ID = "g_family_kushal_01";
const DEFAULT_MEMBER_ID = "m_kushal_admin_01";

function getInitialDB(): LocalDB {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: DEFAULT_ADMIN_ID,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {
          full_name: "Kushal Pokhrel",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kushal",
        },
        aud: "authenticated",
        created_at: now,
        email: "pokhrelkushal01@gmail.com",
        password: "@Kushal0987",
      } as User,
    ],
    profiles: [
      {
        id: DEFAULT_ADMIN_ID,
        full_name: "Kushal Pokhrel",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kushal",
        created_at: now,
        updated_at: now,
      },
    ],
    groups: [
      {
        id: DEFAULT_GROUP_ID,
        name: "Family Expenses",
        currency: "NPR",
        created_by: DEFAULT_ADMIN_ID,
        created_at: now,
        updated_at: now,
      },
    ],
    group_settings: [
      {
        id: "gs_family_01",
        group_id: DEFAULT_GROUP_ID,
        members_can_add_expenses: true,
        members_can_edit_own_expenses: true,
        members_can_record_settlements: true,
        require_approval: false,
        created_at: now,
        updated_at: now,
      },
    ],
    // Clean fresh database: only Kushal as admin
    group_members: [
      {
        id: DEFAULT_MEMBER_ID,
        group_id: DEFAULT_GROUP_ID,
        user_id: DEFAULT_ADMIN_ID,
        name: "Kushal Pokhrel",
        email: "pokhrelkushal01@gmail.com",
        role: "admin",
        status: "active",
        esewa_phone: null,
        esewa_qr_path: null,
        pin_hash: null,
        joined_at: now,
        created_at: now,
        updated_at: now,
      },
    ],
    // Clean fresh database: no old expenses or old dates
    expenses: [],
    expense_participants: [],
    settlements: [],
    notifications: [],
  };
}

class LocalDatabase {
  private db: LocalDB;

  constructor() {
    this.db = this.load();
  }

  private load(): LocalDB {
    if (typeof window === "undefined") return getInitialDB();
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.DB);
      if (!raw) {
        const initial = getInitialDB();
        this.saveDirect(initial);
        return initial;
      }
      const parsed = JSON.parse(raw);
      // Ensure admin exists
      if (!parsed.users?.some((u: User) => u.email === "pokhrelkushal01@gmail.com")) {
        const initial = getInitialDB();
        this.saveDirect(initial);
        return initial;
      }
      return parsed;
    } catch {
      return getInitialDB();
    }
  }

  private saveDirect(data: LocalDB) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save local database", e);
    }
  }

  public save() {
    this.saveDirect(this.db);
  }

  public get<K extends keyof LocalDB>(table: K): LocalDB[K] {
    return this.db[table];
  }

  public getRaw(): LocalDB {
    return this.db;
  }
}

const localDB = new LocalDatabase();

type AuthListener = (event: string, session: Session | null) => void;
const authListeners = new Set<AuthListener>();

function notifyAuth(event: string, session: Session | null) {
  authListeners.forEach((fn) => {
    try {
      fn(event, session);
    } catch (e) {
      console.error("Auth listener error", e);
    }
  });
}

function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setStoredSession(session: Session | null) {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  } catch (e) {
    console.error("Failed to update session", e);
  }
}

function createSessionForUser(user: User): Session {
  const fullUser: SupabaseUser = {
    id: user.id,
    app_metadata: (user.app_metadata as any) || { provider: "email", providers: ["email"] },
    user_metadata: user.user_metadata,
    aud: "authenticated",
    confirmation_sent_at: user.created_at,
    confirmed_at: user.created_at,
    last_sign_in_at: new Date().toISOString(),
    created_at: user.created_at,
    updated_at: new Date().toISOString(),
    email: user.email,
    phone: "",
    role: "authenticated",
  };
  return {
    access_token: `token_${user.id}_${Date.now()}`,
    token_type: "bearer",
    expires_in: 3600 * 24 * 30, // 30 days
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 30,
    refresh_token: `refresh_${user.id}_${Date.now()}`,
    user: fullUser,
  };
}

// Local Supabase Query Builder
class QueryBuilder<T = any> implements PromiseLike<{ data: T | null; error: any }> {
  private tableName: keyof LocalDB;
  private filters: Array<(item: any) => boolean> = [];
  private sorts: Array<(a: any, b: any) => number> = [];
  private selectCols: string = "*";
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private rangeFrom: number = 0;
  private rangeTo: number = Infinity;
  private isMutation: boolean = false;
  private mutationFn?: () => any;

  constructor(tableName: keyof LocalDB) {
    this.tableName = tableName;
  }

  select(cols: string = "*") {
    this.selectCols = cols;
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push((item) => item[column] !== value);
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    const asc = options?.ascending !== false;
    this.sorts.push((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return options?.nullsFirst ? -1 : 1;
      if (valB === null || valB === undefined) return options?.nullsFirst ? 1 : -1;
      return asc ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
    });
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  limit(count: number) {
    this.rangeTo = this.rangeFrom + count - 1;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(values: any | any[]) {
    this.isMutation = true;
    this.mutationFn = () => {
      const table = localDB.get(this.tableName) as any[];
      const items = Array.isArray(values) ? values : [values];
      const inserted = items.map((item) => ({
        ...item,
        id: item.id || `id_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      table.push(...inserted);
      localDB.save();
      return Array.isArray(values) ? inserted : inserted[0];
    };
    return this;
  }

  update(values: any) {
    this.isMutation = true;
    this.mutationFn = () => {
      const table = localDB.get(this.tableName) as any[];
      const updated: any[] = [];
      table.forEach((item, idx) => {
        if (this.filters.every((f) => f(item))) {
          table[idx] = {
            ...item,
            ...values,
            updated_at: new Date().toISOString(),
          };
          updated.push(table[idx]);
        }
      });
      localDB.save();
      return updated;
    };
    return this;
  }

  delete() {
    this.isMutation = true;
    this.mutationFn = () => {
      const table = localDB.get(this.tableName) as any[];
      const remaining = table.filter((item) => !this.filters.every((f) => f(item)));
      (localDB.getRaw() as any)[this.tableName] = remaining;
      localDB.save();
      return { success: true };
    };
    return this;
  }

  private execute(): { data: any; error: any } {
    try {
      if (this.isMutation && this.mutationFn) {
        const res = this.mutationFn();
        return { data: res, error: null };
      }

      const table = localDB.get(this.tableName) as any[];
      let results = table.filter((item) => this.filters.every((f) => f(item)));

      // Apply sorting
      if (this.sorts.length > 0) {
        results = [...results].sort((a, b) => {
          for (const s of this.sorts) {
            const res = s(a, b);
            if (res !== 0) return res;
          }
          return 0;
        });
      }

      // Foreign key / relation joins
      if (this.tableName === "group_members" && this.selectCols.includes("group:groups")) {
        const groups = localDB.get("groups");
        results = results.map((m) => ({
          ...m,
          group: groups.find((g) => g.id === m.group_id) || null,
        }));
      }

      if (this.tableName === "expenses" && this.selectCols.includes("participants:expense_participants")) {
        const allParticipants = localDB.get("expense_participants");
        results = results.map((e) => ({
          ...e,
          participants: allParticipants.filter((p) => p.expense_id === e.id),
        }));
      }

      // Apply range slicing
      if (this.rangeFrom > 0 || this.rangeTo !== Infinity) {
        results = results.slice(this.rangeFrom, this.rangeTo + 1);
      }

      if (this.isSingle) {
        if (results.length === 0) {
          return { data: null, error: new Error(`Row not found in ${this.tableName}`) };
        }
        return { data: results[0], error: null };
      }

      if (this.isMaybeSingle) {
        return { data: results[0] || null, error: null };
      }

      return { data: results, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  then<TResult1 = { data: T | null; error: any }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    const result = this.execute();
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

// Client definition
export const supabase = {
  auth: {
    async getSession(): Promise<{ data: { session: Session | null }; error: null }> {
      const session = getStoredSession();
      return { data: { session }, error: null };
    },

    async getUser(): Promise<{ data: { user: SupabaseUser | null }; error: null }> {
      const session = getStoredSession();
      return { data: { user: session?.user || null }, error: null };
    },

    onAuthStateChange(callback: AuthListener) {
      authListeners.add(callback);
      const session = getStoredSession();
      if (session) {
        setTimeout(() => callback("SIGNED_IN", session), 0);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authListeners.delete(callback);
            },
          },
        },
      };
    },

    async signInWithPassword({ email, password }: { email: string; password?: string }) {
      const cleanEmail = email.trim().toLowerCase();
      const users = localDB.get("users");

      // Check admin credentials or registered user
      let user = users.find((u) => u.email?.toLowerCase() === cleanEmail);

      // Seed / check admin
      if (cleanEmail === "pokhrelkushal01@gmail.com") {
        if (!user) {
          user = {
            id: DEFAULT_ADMIN_ID,
            app_metadata: { provider: "email", providers: ["email"] },
            user_metadata: { full_name: "Kushal Pokhrel" },
            aud: "authenticated",
            email: "pokhrelkushal01@gmail.com",
            password: "@Kushal0987",
            created_at: new Date().toISOString(),
          };
          users.push(user);
          localDB.save();
        }
        if (password !== "@Kushal0987" && password !== user.password) {
          return { data: null, error: new Error("Invalid login credentials") };
        }
      } else {
        if (!user || user.password !== password) {
          return { data: null, error: new Error("Invalid login credentials") };
        }
      }

      if (!user) {
        return { data: null, error: new Error("Invalid login credentials") };
      }

      const session = createSessionForUser(user);
      setStoredSession(session);
      notifyAuth("SIGNED_IN", session);
      return { data: { user: session.user, session }, error: null };
    },

    async signInWithOAuth({ provider }: { provider: string; options?: any }) {
      if (provider === "google") {
        const users = localDB.get("users");
        let adminUser = users.find((u) => u.email === "pokhrelkushal01@gmail.com");
        if (!adminUser) {
          adminUser = {
            id: DEFAULT_ADMIN_ID,
            app_metadata: { provider: "google", providers: ["google"] },
            user_metadata: {
              full_name: "Kushal Pokhrel",
              avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kushal",
            },
            aud: "authenticated",
            email: "pokhrelkushal01@gmail.com",
            password: "@Kushal0987",
            created_at: new Date().toISOString(),
          };
          users.push(adminUser);
          localDB.save();
        }

        const session = createSessionForUser(adminUser);
        setStoredSession(session);
        notifyAuth("SIGNED_IN", session);
        return { data: { provider: "google", url: null }, error: null };
      }
      return { data: null, error: new Error(`Unsupported provider: ${provider}`) };
    },

    async signUp({
      email,
      password,
      options,
    }: {
      email: string;
      password?: string;
      options?: { data?: { full_name?: string } };
    }) {
      const cleanEmail = email.trim().toLowerCase();
      const users = localDB.get("users");

      let existing = users.find((u) => u.email?.toLowerCase() === cleanEmail);
      if (existing) {
        return { data: null, error: new Error("An account with this email already exists.") };
      }

      const newUser: User = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: {
          full_name: options?.data?.full_name || cleanEmail.split("@")[0],
        },
        aud: "authenticated",
        email: cleanEmail,
        password: password || "",
        created_at: new Date().toISOString(),
      };
      users.push(newUser);

      // Create profile
      const profiles = localDB.get("profiles");
      profiles.push({
        id: newUser.id,
        full_name: newUser.user_metadata.full_name || "",
        avatar_url: null,
        created_at: newUser.created_at,
        updated_at: newUser.created_at,
      });

      // Link to group as member
      const groupMembers = localDB.get("group_members");
      groupMembers.push({
        id: `m_${Date.now()}`,
        group_id: DEFAULT_GROUP_ID,
        user_id: newUser.id,
        name: newUser.user_metadata.full_name || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: "member",
        status: "active",
        esewa_phone: null,
        esewa_qr_path: null,
        pin_hash: null,
        joined_at: newUser.created_at,
        created_at: newUser.created_at,
        updated_at: newUser.created_at,
      });

      localDB.save();

      const session = createSessionForUser(newUser);
      setStoredSession(session);
      notifyAuth("SIGNED_IN", session);
      return { data: { user: session.user, session }, error: null };
    },

    async signOut() {
      setStoredSession(null);
      notifyAuth("SIGNED_OUT", null);
      return { error: null };
    },

    async resetPasswordForEmail(_email: string, _options?: any) {
      return { data: {}, error: null };
    },

    async updateUser({ password }: { password?: string }) {
      const session = getStoredSession();
      if (!session) return { data: null, error: new Error("Not authenticated") };

      const users = localDB.get("users");
      const user = users.find((u) => u.id === session.user.id);
      if (user && password) {
        user.password = password;
        localDB.save();
      }
      return { data: { user: session.user }, error: null };
    },

    async setSession(tokens: any) {
      if (!tokens?.user) return { error: new Error("Invalid session tokens") };
      const session = createSessionForUser(tokens.user);
      setStoredSession(session);
      notifyAuth("SIGNED_IN", session);
      return { data: { session }, error: null };
    },
  },

  from(tableName: keyof LocalDB) {
    return new QueryBuilder(tableName);
  },

  async rpc(fnName: string, args?: any): Promise<{ data: any; error: any }> {
    try {
      const now = new Date().toISOString();

      if (fnName === "claim_memberships") {
        const session = getStoredSession();
        if (session) {
          const members = localDB.get("group_members");
          members.forEach((m) => {
            if (session.user.email && m.email?.toLowerCase() === session.user.email.toLowerCase() && !m.user_id) {
              m.user_id = session.user.id;
            }
          });
          localDB.save();
        }
        return { data: true, error: null };
      }

      if (fnName === "create_group") {
        const session = getStoredSession();
        const userId = session?.user.id || DEFAULT_ADMIN_ID;
        const groupId = `g_${Date.now()}`;
        const groups = localDB.get("groups");
        groups.push({
          id: groupId,
          name: args.p_name,
          currency: args.p_currency || "NPR",
          created_by: userId,
          created_at: now,
          updated_at: now,
        });

        const settings = localDB.get("group_settings");
        settings.push({
          id: `gs_${Date.now()}`,
          group_id: groupId,
          members_can_add_expenses: true,
          members_can_edit_own_expenses: true,
          members_can_record_settlements: true,
          require_approval: false,
          created_at: now,
          updated_at: now,
        });

        const members = localDB.get("group_members");
        members.push({
          id: `m_${Date.now()}`,
          group_id: groupId,
          user_id: userId,
          name: args.p_member_name || session?.user.user_metadata.full_name || "Admin",
          email: session?.user.email || null,
          role: "admin",
          status: "active",
          esewa_phone: null,
          esewa_qr_path: null,
          pin_hash: null,
          joined_at: now,
          created_at: now,
          updated_at: now,
        });

        localDB.save();
        return { data: groupId, error: null };
      }

      if (fnName === "save_expense") {
        const session = getStoredSession();
        const userId = session?.user.id || DEFAULT_ADMIN_ID;
        const expenses = localDB.get("expenses");
        const participants = localDB.get("expense_participants");

        const expenseId = args.p_expense_id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const existingIdx = expenses.findIndex((e) => e.id === expenseId);

        const expenseRecord = {
          id: expenseId,
          group_id: args.p_group_id,
          title: args.p_title,
          description: args.p_description || null,
          amount_minor: args.p_amount_minor,
          category: args.p_category,
          expense_date: args.p_expense_date,
          expense_time: args.p_expense_time || null,
          paid_by: args.p_paid_by,
          split_method: args.p_split_method,
          notes: args.p_notes || null,
          created_by: userId,
          created_at: existingIdx >= 0 ? expenses[existingIdx].created_at : now,
          updated_at: now,
        };

        if (existingIdx >= 0) {
          expenses[existingIdx] = expenseRecord;
        } else {
          expenses.push(expenseRecord);
        }

        // Remove old participants if editing
        const remainingParticipants = participants.filter((p) => p.expense_id !== expenseId);
        (localDB.getRaw() as any).expense_participants = remainingParticipants;

        // Insert new participants
        if (Array.isArray(args.p_participants)) {
          args.p_participants.forEach((p: any) => {
            remainingParticipants.push({
              id: `part_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              expense_id: expenseId,
              member_id: p.member_id,
              share_minor: p.share_minor,
              percentage_bps: p.percentage_bps || null,
              created_at: now,
            });
          });
        }

        localDB.save();
        return { data: expenseId, error: null };
      }

      if (fnName === "delete_expense") {
        const expenses = localDB.get("expenses");
        const participants = localDB.get("expense_participants");
        (localDB.getRaw() as any).expenses = expenses.filter((e) => e.id !== args.p_expense_id);
        (localDB.getRaw() as any).expense_participants = participants.filter(
          (p) => p.expense_id !== args.p_expense_id
        );
        localDB.save();
        return { data: true, error: null };
      }

      if (fnName === "record_settlement") {
        const session = getStoredSession();
        const userId = session?.user.id || DEFAULT_ADMIN_ID;
        const settlements = localDB.get("settlements");
        const settlementId = `set_${Date.now()}`;

        settlements.push({
          id: settlementId,
          group_id: args.p_group_id,
          payer_member_id: args.p_payer,
          receiver_member_id: args.p_receiver,
          amount_minor: args.p_amount_minor,
          settlement_date: args.p_date,
          notes: args.p_notes || null,
          status: args.p_status || "completed",
          created_by: userId,
          created_at: now,
          updated_at: now,
        });

        localDB.save();
        return { data: settlementId, error: null };
      }

      if (fnName === "complete_settlement") {
        const settlements = localDB.get("settlements");
        const item = settlements.find((s) => s.id === args.p_settlement_id);
        if (item) {
          item.status = "completed";
          item.updated_at = now;
          localDB.save();
        }
        return { data: true, error: null };
      }

      if (fnName === "delete_settlement") {
        const settlements = localDB.get("settlements");
        (localDB.getRaw() as any).settlements = settlements.filter(
          (s) => s.id !== args.p_settlement_id
        );
        localDB.save();
        return { data: true, error: null };
      }

      if (fnName === "set_member_payment_info") {
        const members = localDB.get("group_members");
        const member = members.find((m) => m.id === args.p_member_id);
        if (member) {
          member.esewa_phone = args.p_esewa_phone || null;
          member.esewa_qr_path = args.p_esewa_qr_path || null;
          member.updated_at = now;
          localDB.save();
        }
        return { data: true, error: null };
      }

      if (fnName === "set_member_pin") {
        const members = localDB.get("group_members");
        const member = members.find((m) => m.id === args.p_member_id);
        if (member) {
          member.pin_hash = args.p_pin;
          member.updated_at = now;
          localDB.save();
        }
        return { data: true, error: null };
      }

      if (fnName === "verify_member_pin") {
        const members = localDB.get("group_members");
        const member = members.find((m) => m.id === args.p_member_id);
        const valid = member && member.pin_hash === args.p_pin;
        return { data: valid, error: null };
      }

      return { data: null, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  },

  storage: {
    from(_bucket: string) {
      return {
        async upload(_path: string, _file: any, _options?: any): Promise<{ data: { path: string } | null; error: any }> {
          return { data: { path: _path }, error: null };
        },
        async remove(_paths: string[]): Promise<{ data: any; error: any }> {
          return { data: [], error: null };
        },
        async createSignedUrl(path: string, _expiresIn: number) {
          return { data: { signedUrl: path }, error: null };
        },
        getPublicUrl(path: string) {
          return { data: { publicUrl: path } };
        },
      };
    },
  },
};
