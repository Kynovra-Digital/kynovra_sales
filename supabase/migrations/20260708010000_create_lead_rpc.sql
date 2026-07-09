create or replace function public.create_lead(
  p_name text,
  p_email text,
  p_phone text default null,
  p_source text default 'manual',
  p_product_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead_id uuid;
  v_org_id uuid;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Informe o nome do contato.';
  end if;

  if nullif(trim(p_email), '') is null then
    raise exception 'Informe o e-mail do contato.';
  end if;

  if p_product_id is not null then
    select p.organization_id
      into v_org_id
    from public.products p
    where p.id = p_product_id
    limit 1;

    if v_org_id is null then
      raise exception 'Produto não encontrado.';
    end if;
  end if;

  insert into public.leads (
    organization_id,
    name,
    email,
    phone,
    source,
    product_id
  )
  values (
    v_org_id,
    trim(p_name),
    lower(trim(p_email)),
    p_phone,
    p_source,
    p_product_id
  )
  returning id into v_lead_id;

  return jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id
  );
end;
$$;
