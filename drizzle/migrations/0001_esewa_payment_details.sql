ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS esewa_phone text,
  ADD COLUMN IF NOT EXISTS esewa_qr_path text;

-- Can the current user edit payment details of this member?
CREATE OR REPLACE FUNCTION public.can_edit_member_payment(_member_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  select exists (
    select 1 from public.group_members m
    where m.id = _member_id
      and (public.is_group_admin(m.group_id)
           or (m.user_id = auth.uid() and m.status = 'active'))
  );
$$;

-- Storage path format: <group_id>/<member_id>/<file>
CREATE OR REPLACE FUNCTION public.payment_qr_can_read(_name text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
declare parts text[] := string_to_array(_name, '/');
begin
  if array_length(parts, 1) <> 3 then return false; end if;
  return public.is_group_member(parts[1]::uuid);
exception when others then return false;
end; $$;

CREATE OR REPLACE FUNCTION public.payment_qr_can_write(_name text)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
declare parts text[] := string_to_array(_name, '/');
begin
  if array_length(parts, 1) <> 3 then return false; end if;
  if not exists (select 1 from public.group_members where id = parts[2]::uuid and group_id = parts[1]::uuid) then
    return false;
  end if;
  return public.can_edit_member_payment(parts[2]::uuid);
exception when others then return false;
end; $$;

CREATE OR REPLACE FUNCTION public.set_member_payment_info(p_member_id uuid, p_esewa_phone text, p_qr_path text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
declare
  v_group uuid;
  v_phone text := nullif(regexp_replace(coalesce(p_esewa_phone, ''), '[\s-]', '', 'g'), '');
  v_path text := nullif(trim(coalesce(p_qr_path, '')), '');
begin
  select group_id into v_group from public.group_members where id = p_member_id;
  if v_group is null then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;
  if not public.can_edit_member_payment(p_member_id) then
    raise exception 'You can only change your own payment details' using errcode = '42501';
  end if;
  if v_phone is not null then
    if v_phone like '+977%' then v_phone := substr(v_phone, 5); end if;
    if v_phone !~ '^9[0-9]{9}$' then
      raise exception 'Enter a 10-digit eSewa mobile number starting with 9' using errcode = '22023';
    end if;
  end if;
  if v_path is not null and v_path not like v_group::text || '/' || p_member_id::text || '/%' then
    raise exception 'Invalid QR picture' using errcode = '22023';
  end if;
  update public.group_members set esewa_phone = v_phone, esewa_qr_path = v_path where id = p_member_id;
end; $$;

REVOKE ALL ON FUNCTION public.set_member_payment_info(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_member_payment_info(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_member_payment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_qr_can_read(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.payment_qr_can_write(text) TO authenticated;

CREATE POLICY "Household members view payment QR" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'payment-qr' AND public.payment_qr_can_read(name));
CREATE POLICY "Owner or admin uploads payment QR" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name));
CREATE POLICY "Owner or admin updates payment QR" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name))
  WITH CHECK (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name));
CREATE POLICY "Owner or admin deletes payment QR" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'payment-qr' AND public.payment_qr_can_write(name));