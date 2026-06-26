create or replace function public.generate_unique_product_code(
  p_organization_id uuid,
  p_exclude_product_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  loop
    v_code := '789' || lpad(floor(random() * 10000000000)::bigint::text, 10, '0');

    exit when not exists (
      select 1
      from public.products
      where organization_id = p_organization_id
        and slug = v_code
        and (p_exclude_product_id is null or id <> p_exclude_product_id)
    );
  end loop;

  return v_code;
end;
$$;

grant execute on function public.generate_unique_product_code(uuid, uuid)
  to authenticated;
