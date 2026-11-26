-- Family Expense Tracker — Complete Supabase Database Setup
-- Run this script once in your Supabase Dashboard -> SQL Editor -> New Query

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Enums
DO $$ BEGIN
  CREATE TYPE public.expense_category AS ENUM (
    'food', 'groceries', 'rent', 'electricity', 'internet',
    'transportation', 'fuel', 'entertainment', 'shopping',
    'medical', 'education', 'household', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.group_role AS ENUM ('admin', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.member_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.settlement_status AS ENUM ('pending', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.split_method AS ENUM ('equal', 'exact', 'percentage', 'individual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  currency text NOT NULL DEFAULT 'NPR',
  created_by uuid NOT NULL,
  invite_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(12), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL,
  email text,
  avatar_url text,
  esewa_phone text,
  esewa_qr_path text,
  role public.group_role NOT NULL DEFAULT 'member',
  status public.member_status NOT NULL DEFAULT 'active',
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS group_members_group_email_key
  ON public.group_members(group_id, lower(email)) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.group_settings (
  group_id uuid PRIMARY KEY REFERENCES public.groups(id) ON DELETE CASCADE,
  default_split_method public.split_method NOT NULL DEFAULT 'equal',
  members_can_add_expenses boolean NOT NULL DEFAULT true,
  members_can_edit_own_expenses boolean NOT NULL DEFAULT true,
  members_can_record_settlements boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  category public.expense_category NOT NULL DEFAULT 'other',
  expense_date date NOT NULL DEFAULT current_date,
  expense_time time,
  paid_by uuid NOT NULL REFERENCES public.group_members(id),
  split_method public.split_method NOT NULL DEFAULT 'equal',
  notes text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.group_members(id),
  share_minor bigint NOT NULL CHECK (share_minor >= 0),
  percentage_bps integer
);

CREATE TABLE IF NOT EXISTS public.settlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  payer_member_id uuid NOT NULL REFERENCES public.group_members(id),
  receiver_member_id uuid NOT NULL REFERENCES public.group_members(id),
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  settlement_date date NOT NULL DEFAULT current_date,
  notes text NOT NULL DEFAULT '',
  status public.settlement_status NOT NULL DEFAULT 'completed',
  completed_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_pins (
  member_id uuid PRIMARY KEY REFERENCES public.group_members(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  recipient_member_id uuid REFERENCES public.group_members(id) ON DELETE SET NULL,
  subject text NOT NULL,
  notification_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'delivered', 'delayed', 'bounced', 'failed')),
  provider text,
  resend_email_id text,
  error_message text,
  idempotency_key text,
  html_body text,
  text_body text,
  retry_count int NOT NULL DEFAULT 0,
  max_retries int NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Auto-create profile on sign-up / Google login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, ''), '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Helper Functions
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = _group_id AND user_id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.my_member_id(_group_id uuid)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.group_members
  WHERE group_id = _group_id AND user_id = auth.uid() AND status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_member_payment(_member_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members m
    WHERE m.id = _member_id
      AND (public.is_group_admin(m.group_id)
           OR (m.user_id = auth.uid() AND m.status = 'active'))
  );
$$;

-- 6. RPC Functions
CREATE OR REPLACE FUNCTION public.claim_memberships()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text;
  v_count int := 0;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN
    RETURN 0;
  END IF;
  UPDATE public.group_members
  SET user_id = auth.uid()
  WHERE lower(email) = lower(v_email) AND user_id IS NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_group(
  p_name text,
  p_currency text DEFAULT 'NPR',
  p_member_name text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_gid uuid;
  v_email text;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING errcode = '42501';
  END IF;

  SELECT email, COALESCE(NULLIF(trim(p_member_name), ''), NULLIF(raw_user_meta_data->>'full_name', ''), split_part(email, '@', 1), 'Admin')
  INTO v_email, v_name
  FROM auth.users WHERE id = v_uid;

  INSERT INTO public.groups (name, currency, created_by)
  VALUES (trim(p_name), COALESCE(NULLIF(trim(p_currency), ''), 'NPR'), v_uid)
  RETURNING id INTO v_gid;

  INSERT INTO public.group_settings (group_id) VALUES (v_gid);

  INSERT INTO public.group_members (group_id, user_id, name, email, role, status)
  VALUES (v_gid, v_uid, v_name, lower(v_email), 'admin', 'active');

  RETURN v_gid;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_expense(
  p_expense_id uuid,
  p_group_id uuid,
  p_title text,
  p_description text,
  p_amount_minor bigint,
  p_category public.expense_category,
  p_expense_date date,
  p_expense_time time,
  p_paid_by uuid,
  p_split_method public.split_method,
  p_notes text,
  p_participants jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_eid uuid;
  v_part jsonb;
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group' USING errcode = '42501';
  END IF;

  IF p_expense_id IS NULL THEN
    INSERT INTO public.expenses (
      group_id, title, description, amount_minor, category,
      expense_date, expense_time, paid_by, split_method, notes, created_by
    ) VALUES (
      p_group_id, trim(p_title), COALESCE(p_description, ''), p_amount_minor, p_category,
      p_expense_date, p_expense_time, p_paid_by, p_split_method, COALESCE(p_notes, ''), v_uid
    )
    RETURNING id INTO v_eid;
  ELSE
    IF NOT (
      public.is_group_admin(p_group_id)
      OR EXISTS (SELECT 1 FROM public.expenses WHERE id = p_expense_id AND created_by = v_uid)
    ) THEN
      RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
    END IF;

    UPDATE public.expenses SET
      title = trim(p_title),
      description = COALESCE(p_description, ''),
      amount_minor = p_amount_minor,
      category = p_category,
      expense_date = p_expense_date,
      expense_time = p_expense_time,
      paid_by = p_paid_by,
      split_method = p_split_method,
      notes = COALESCE(p_notes, ''),
      updated_at = now()
    WHERE id = p_expense_id AND group_id = p_group_id
    RETURNING id INTO v_eid;

    DELETE FROM public.expense_participants WHERE expense_id = v_eid;
  END IF;

  FOR v_part IN SELECT * FROM jsonb_array_elements(p_participants)
  LOOP
    INSERT INTO public.expense_participants (expense_id, member_id, share_minor, percentage_bps)
    VALUES (
      v_eid,
      (v_part->>'member_id')::uuid,
      (v_part->>'share_minor')::bigint,
      NULLIF(v_part->>'percentage_bps', '')::integer
    );
  END LOOP;

  RETURN v_eid;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_expense(p_expense_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_gid uuid;
  v_created uuid;
BEGIN
  SELECT group_id, created_by INTO v_gid, v_created FROM public.expenses WHERE id = p_expense_id;
  IF v_gid IS NULL THEN RETURN; END IF;
  IF NOT (public.is_group_admin(v_gid) OR v_created = auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;
  DELETE FROM public.expenses WHERE id = p_expense_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_settlement(
  p_group_id uuid,
  p_payer uuid,
  p_receiver uuid,
  p_amount_minor bigint,
  p_date date,
  p_notes text,
  p_status public.settlement_status DEFAULT 'completed'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sid uuid;
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN
    RAISE EXCEPTION 'Not a member of this group' USING errcode = '42501';
  END IF;

  INSERT INTO public.settlements (
    group_id, payer_member_id, receiver_member_id, amount_minor,
    settlement_date, notes, status, completed_at, created_by
  ) VALUES (
    p_group_id, p_payer, p_receiver, p_amount_minor,
    p_date, COALESCE(p_notes, ''), p_status,
    CASE WHEN p_status = 'completed' THEN now() ELSE NULL END,
    auth.uid()
  )
  RETURNING id INTO v_sid;

  RETURN v_sid;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_settlement(p_settlement_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_gid uuid;
  v_rec uuid;
BEGIN
  SELECT group_id, receiver_member_id INTO v_gid, v_rec FROM public.settlements WHERE id = p_settlement_id;
  IF v_gid IS NULL THEN RETURN; END IF;
  IF NOT (public.is_group_admin(v_gid) OR v_rec = public.my_member_id(v_gid)) THEN
    RAISE EXCEPTION 'Only receiver or admin can confirm' USING errcode = '42501';
  END IF;
  UPDATE public.settlements SET status = 'completed', completed_at = now() WHERE id = p_settlement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_settlement(p_settlement_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_gid uuid;
  v_created uuid;
BEGIN
  SELECT group_id, created_by INTO v_gid, v_created FROM public.settlements WHERE id = p_settlement_id;
  IF v_gid IS NULL THEN RETURN; END IF;
  IF NOT (public.is_group_admin(v_gid) OR v_created = auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied' USING errcode = '42501';
  END IF;
  DELETE FROM public.settlements WHERE id = p_settlement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_member(
  p_member_id uuid,
  p_group_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  IF NOT public.is_group_member(p_group_id) THEN RETURN; END IF;
  SELECT user_id INTO v_uid FROM public.group_members WHERE id = p_member_id AND group_id = p_group_id;
  IF v_uid IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, group_id, type, title, body, link)
    VALUES (v_uid, p_group_id, p_type, p_title, COALESCE(p_body, ''), p_link);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.regenerate_invite_token(p_group_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE t text;
BEGIN
  IF NOT public.is_group_admin(p_group_id) THEN
    RAISE EXCEPTION 'Only admins can reset the invite link' USING errcode = '42501';
  END IF;
  t := encode(extensions.gen_random_bytes(12), 'hex');
  UPDATE public.groups SET invite_token = t WHERE id = p_group_id;
  RETURN t;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_member_payment_info(
  p_member_id uuid,
  p_esewa_phone text,
  p_qr_path text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_group uuid;
  v_phone text := nullif(regexp_replace(coalesce(p_esewa_phone, ''), '[\s-]', '', 'g'), '');
  v_path text := nullif(trim(coalesce(p_qr_path, '')), '');
BEGIN
  SELECT group_id INTO v_group FROM public.group_members WHERE id = p_member_id;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'Member not found' USING errcode = 'P0002';
  END IF;
  IF NOT public.can_edit_member_payment(p_member_id) THEN
    RAISE EXCEPTION 'You can only change your own payment details' USING errcode = '42501';
  END IF;
  IF v_phone IS NOT NULL THEN
    IF v_phone LIKE '+977%' THEN v_phone := substr(v_phone, 5); END IF;
    IF v_phone !~ '^9[0-9]{9}$' THEN
      RAISE EXCEPTION 'Enter a 10-digit eSewa mobile number starting with 9' USING errcode = '22023';
    END IF;
  END IF;
  IF v_path IS NOT NULL AND v_path NOT LIKE v_group::text || '/' || p_member_id::text || '/%' THEN
    RAISE EXCEPTION 'Invalid QR picture' USING errcode = '22023';
  END IF;
  UPDATE public.group_members SET esewa_phone = v_phone, esewa_qr_path = v_path WHERE id = p_member_id;
END;
$$;

-- 7. Storage Bucket & Policies for eSewa QR Pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr', 'payment-qr', false)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.payment_qr_can_read(_name text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE parts text[] := string_to_array(_name, '/');
BEGIN
  IF array_length(parts, 1) <> 3 THEN RETURN false; END IF;
  RETURN public.is_group_member(parts[1]::uuid);
EXCEPTION WHEN others THEN RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.payment_qr_can_write(_name text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE parts text[] := string_to_array(_name, '/');
BEGIN
  IF array_length(parts, 1) <> 3 THEN RETURN false; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.group_members WHERE id = parts[2]::uuid AND group_id = parts[1]::uuid) THEN
    RETURN false;
  END IF;
  RETURN public.can_edit_member_payment(parts[2]::uuid);
EXCEPTION WHEN others THEN RETURN false;
END;
$$;

DROP POLICY IF EXISTS "Household members view payment QR" ON storage.objects;
CREATE POLICY "Household members view payment QR" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-qr' AND public.payment_qr_can_read(name));

DROP POLICY IF EXISTS "Owner or admin uploads payment QR" ON storage.objects;
CREATE POLICY "Owner or admin uploads payment QR" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name));

DROP POLICY IF EXISTS "Owner or admin updates payment QR" ON storage.objects;
CREATE POLICY "Owner or admin updates payment QR" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name))
  WITH CHECK (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name));

DROP POLICY IF EXISTS "Owner or admin deletes payment QR" ON storage.objects;
CREATE POLICY "Owner or admin deletes payment QR" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name));

-- 8. Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_pins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Members read groups" ON public.groups FOR SELECT TO authenticated USING (public.is_group_member(id));
CREATE POLICY "Admins update groups" ON public.groups FOR UPDATE TO authenticated USING (public.is_group_admin(id));
CREATE POLICY "Admins delete groups" ON public.groups FOR DELETE TO authenticated USING (public.is_group_admin(id));

CREATE POLICY "Members read group_members" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(group_id) OR user_id = auth.uid());
CREATE POLICY "Admins insert group_members" ON public.group_members FOR INSERT TO authenticated WITH CHECK (public.is_group_admin(group_id));
CREATE POLICY "Admins update group_members" ON public.group_members FOR UPDATE TO authenticated USING (public.is_group_admin(group_id));
CREATE POLICY "Admins delete group_members" ON public.group_members FOR DELETE TO authenticated USING (public.is_group_admin(group_id));

CREATE POLICY "Members read group_settings" ON public.group_settings FOR SELECT TO authenticated USING (public.is_group_member(group_id));
CREATE POLICY "Admins update group_settings" ON public.group_settings FOR UPDATE TO authenticated USING (public.is_group_admin(group_id));

CREATE POLICY "Members read expenses" ON public.expenses FOR SELECT TO authenticated USING (public.is_group_member(group_id));
CREATE POLICY "Members read participants" ON public.expense_participants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.expenses e WHERE e.id = expense_id AND public.is_group_member(e.group_id)));

CREATE POLICY "Members read settlements" ON public.settlements FOR SELECT TO authenticated USING (public.is_group_member(group_id));

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- 9. Grants
GRANT ALL ON public.member_pins TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_memberships() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_group(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_expense(uuid, uuid, text, text, bigint, public.expense_category, date, time, uuid, public.split_method, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_expense(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_settlement(uuid, uuid, uuid, bigint, date, text, public.settlement_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_settlement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_settlement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_member(uuid, uuid, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_invite_token(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_member_payment_info(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_member_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_member_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_qr_can_read(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_qr_can_write(text) TO authenticated;
