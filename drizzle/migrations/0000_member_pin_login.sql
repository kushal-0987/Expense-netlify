ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(12), 'hex');
CREATE UNIQUE INDEX IF NOT EXISTS groups_invite_token_key ON public.groups(invite_token);

CREATE TABLE public.member_pins (
  member_id uuid PRIMARY KEY REFERENCES public.group_members(id) ON DELETE CASCADE,
  auth_user_id uuid NOT NULL,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.member_pins TO service_role;
ALTER TABLE public.member_pins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.regenerate_invite_token(p_group_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare t text;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Only admins can reset the invite link' using errcode = '42501';
  end if;
  t := encode(extensions.gen_random_bytes(12), 'hex');
  update public.groups set invite_token = t where id = p_group_id;
  return t;
end; $$;
REVOKE ALL ON FUNCTION public.regenerate_invite_token(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.regenerate_invite_token(uuid) TO authenticated;