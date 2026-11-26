-- Email Delivery & Audit Logs Table for Resend Integration
-- Run this in your Supabase SQL Editor if it has not been created yet.

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
  resend_email_id text,
  error_message text,
  idempotency_key text,
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique index on idempotency_key when present to prevent duplicate sends
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_idempotency_key
  ON public.email_logs(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_group_id ON public.email_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_resend_id ON public.email_logs(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Household members can read email delivery logs for their household
CREATE POLICY "Members read own group email logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id));

-- Household admins can manage email delivery logs for their household
CREATE POLICY "Admins manage group email logs"
  ON public.email_logs
  FOR ALL
  TO authenticated
  USING (public.is_group_admin(group_id));
