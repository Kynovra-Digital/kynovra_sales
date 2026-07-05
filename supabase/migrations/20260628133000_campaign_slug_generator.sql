create or replace function public.generate_unique_campaign_slug(
  p_organization_id uuid,
  p_name text,
  p_exclude_campaign_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_slug text;
  v_suffix integer := 1;
begin
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  v_base := trim(both '-' from regexp_replace(
    lower(extensions.unaccent(trim(p_name))), '[^a-z0-9]+', '-', 'g'
  ));

  if v_base = '' then
    v_base := 'campanha';
  end if;

  v_slug := left(v_base, 80);

  while exists (
    select 1
    from public.campaigns
    where organization_id = p_organization_id
      and slug = v_slug
      and (p_exclude_campaign_id is null or id <> p_exclude_campaign_id)
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := left(v_base, greatest(1, 80 - length('-' || v_suffix::text))) || '-' || v_suffix::text;
  end loop;

  return v_slug;
end;
$$;

grant execute on function public.generate_unique_campaign_slug(uuid, text, uuid)
  to authenticated;
