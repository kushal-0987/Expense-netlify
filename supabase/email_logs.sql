-- Email Delivery, Persistent Queue & Audit Logs Table
-- Run this in your Supabase SQL Editor. Safe to re-run (uses IF NOT EXISTS).

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

-- Safe migrations if email_logs already existed
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS text_body text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS retry_count int NOT NULL DEFAULT 0;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS max_retries int NOT NULL DEFAULT 3;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS next_retry_at timestamptz;

-- Unique index on idempotency_key when present to prevent duplicate sends
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_idempotency_key
  ON public.email_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Indexes for queue processing and audit queries
CREATE INDEX IF NOT EXISTS idx_email_logs_group_id ON public.email_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON public.email_logs(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_queue ON public.email_logs(status, next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Household members can read email delivery logs for their household
DROP POLICY IF EXISTS "Members read own group email logs" ON public.email_logs;
CREATE POLICY "Members read own group email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id));

-- Household admins can manage email delivery logs for their household
DROP POLICY IF EXISTS "Admins manage group email logs" ON public.email_logs;
CREATE POLICY "Admins manage group email logs"
  ON public.email_logs
  FOR ALL
  TO authenticated
  USING (public.is_group_admin(group_id));
