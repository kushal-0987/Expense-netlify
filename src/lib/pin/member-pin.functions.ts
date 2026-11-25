import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { afterFailedAttempt, isLocked, isValidPin } from "./rules";

const uuidRe = /^[0-9a-f-]{36}$/i;

async function derivePassword(memberId: string, pin: string) {
  const secret = process.env["MEMBER_PIN_SECRET"];
  if (!secret) throw new Error("PIN login is not configured");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${memberId}:${pin}`));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

const pinEmail = (memberId: string) => `member-${memberId}@pin.family-expenses.app`;

async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

/** Admin sets (or changes) a member's PIN. */
export const setMemberPin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { memberId: string; pin: string }) => {
    if (!uuidRe.test(d.memberId)) throw new Error("Invalid member");
    if (!isValidPin(d.pin)) throw new Error("PIN must be 4 to 6 digits");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: member, error } = await context.supabase
      .from("group_members").select("id, group_id, user_id, name").eq("id", data.memberId).maybeSingle();
    if (error || !member) throw new Error("Member not found");
    const { data: ok } = await context.supabase.rpc("is_group_admin", { _group_id: member.group_id });
    if (!ok) throw new Error("Only admins can set PINs");

    const sb = await admin();
    const { data: existing } = await sb.from("member_pins").select("auth_user_id").eq("member_id", member.id).maybeSingle();
    if (member.user_id && member.user_id !== existing?.auth_user_id) {
      throw new Error(`${member.name} already signs in with their own account.`);
    }
    const password = await derivePassword(member.id, data.pin);
    let authId = existing?.auth_user_id;
    if (authId) {
      const { error: e } = await sb.auth.admin.updateUserById(authId, { password });
      if (e) throw new Error("Could not update the PIN");
    } else {
      const { data: created, error: e } = await sb.auth.admin.createUser({
        email: pinEmail(member.id), password, email_confirm: true,
        user_metadata: { full_name: member.name, pin_member: true },
      });
      if (e || !created.user) throw new Error("Could not create the PIN login");
      authId = created.user.id;
      const { error: le } = await sb.from("group_members").update({ user_id: authId }).eq("id", member.id);
      if (le) throw new Error("Could not link the PIN login");
    }
    await sb.from("member_pins").upsert({ member_id: member.id, auth_user_id: authId, failed_attempts: 0, locked_until: null, updated_at: new Date().toISOString() });
    return { ok: true };
  });

/** Admin: which members in the group have a PIN. */
export const listPinMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { groupId: string }) => {
    if (!uuidRe.test(d.groupId)) throw new Error("Invalid group");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: ok } = await context.supabase.rpc("is_group_admin", { _group_id: data.groupId });
    if (!ok) return [] as string[];
    const sb = await admin();
    const { data: members } = await sb.from("group_members").select("id").eq("group_id", data.groupId);
    const ids = (members ?? []).map((m) => m.id);
    if (!ids.length) return [];
    const { data: pins } = await sb.from("member_pins").select("member_id").in("member_id", ids);
    return (pins ?? []).map((p) => p.member_id);
  });

/** Public: the invite page — household name and the members who can log in with a PIN. */
export const getInvite = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => {
    if (!/^[0-9a-f]{16,64}$/.test(d.token)) throw new Error("Invalid link");
    return d;
  })
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: group } = await sb.from("groups").select("id, name").eq("invite_token", data.token).maybeSingle();
    if (!group) return null;
    const { data: members } = await sb.from("group_members").select("id, name").eq("group_id", group.id).eq("status", "active").order("name");
    const ids = (members ?? []).map((m) => m.id);
    const { data: pins } = ids.length ? await sb.from("member_pins").select("member_id").in("member_id", ids) : { data: [] };
    const withPin = new Set((pins ?? []).map((p) => p.member_id));
    return { name: group.name, members: (members ?? []).filter((m) => withPin.has(m.id)) };
  });

/** Public: log in with the invite link + member + PIN. Returns a session. */
export const pinLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; memberId: string; pin: string }) => {
    if (!/^[0-9a-f]{16,64}$/.test(d.token) || !uuidRe.test(d.memberId)) throw new Error("Invalid link");
    if (!isValidPin(d.pin)) throw new Error("Wrong PIN");
    return d;
  })
  .handler(async ({ data }) => {
    const sb = await admin();
    const { data: group } = await sb.from("groups").select("id").eq("invite_token", data.token).maybeSingle();
    if (!group) throw new Error("This invite link is no longer valid");
    const { data: member } = await sb.from("group_members").select("id, status").eq("id", data.memberId).eq("group_id", group.id).maybeSingle();
    if (!member || member.status !== "active") throw new Error("Member not found");
    const { data: pin } = await sb.from("member_pins").select("*").eq("member_id", member.id).maybeSingle();
    if (!pin) throw new Error("No PIN has been set for this member");
    const now = new Date();
    if (isLocked(pin.locked_until, now)) throw new Error("Too many wrong tries. Try again in 15 minutes.");

    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const pub = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      } },
    });
    const { data: auth, error } = await pub.auth.signInWithPassword({ email: pinEmail(member.id), password: await derivePassword(member.id, data.pin) });
    if (error || !auth.session) {
      await sb.from("member_pins").update(afterFailedAttempt(pin.failed_attempts, now)).eq("member_id", member.id);
      throw new Error("Wrong PIN");
    }
    await sb.from("member_pins").update({ failed_attempts: 0, locked_until: null }).eq("member_id", member.id);
    return { access_token: auth.session.access_token, refresh_token: auth.session.refresh_token };
  });
