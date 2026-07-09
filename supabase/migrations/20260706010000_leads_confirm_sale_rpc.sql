-- Policies for leads + sales_confirmations write
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'leads'
      and policyname = 'Leads writable by organization managers'
  ) then
    create policy "Leads writable by organization managers"
    on public.leads
    for all
    to authenticated
    using (
      organization_id = public.current_user_organization_id()
      and public.current_user_is_manager()
    )
    with check (
      organization_id = public.current_user_organization_id()
      and public.current_user_is_manager()
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sales_confirmations'
      and policyname = 'Sales confirmations visible to organization users'
  ) then
    create policy "Sales confirmations visible to organization users"
    on public.sales_confirmations
    for select
    to authenticated
    using (organization_id = public.current_user_organization_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sales_confirmations'
      and policyname = 'Sales confirmations writable by organization managers'
  ) then
    create policy "Sales confirmations writable by organization managers"
    on public.sales_confirmations
    for insert
    to authenticated
    with check (
      organization_id = public.current_user_organization_id()
      and public.current_user_is_manager()
    );
  end if;
end $$;

-- Allow manual sales confirmations without a sales session
alter table public.sales_confirmations
  alter column sales_session_id drop not null;

-- RPC to confirm a lead sale manually
create or replace function public.confirm_lead_sale(p_lead_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.leads%rowtype;
  v_product public.products%rowtype;
  v_confirmation_id uuid;
begin
  select * into v_lead from public.leads where id = p_lead_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Lead não encontrado.');
  end if;

  if v_lead.organization_id <> public.current_user_organization_id() then
    return jsonb_build_object('success', false, 'error', 'Lead não pertence à organização.');
  end if;

  if not public.current_user_is_manager() then
    return jsonb_build_object('success', false, 'error', 'Sem permissão para confirmar vendas.');
  end if;

  select * into v_product from public.products where id = v_lead.product_id;

  insert into public.sales_confirmations (
    organization_id,
    sales_session_id,
    product_id,
    confirmed_by,
    amount,
    source,
    metadata
  ) values (
    v_lead.organization_id,
    null,
    v_lead.product_id,
    auth.uid()::text,
    v_product.price,
    'manual',
    jsonb_build_object(
      'lead_id', v_lead.id,
      'lead_name', v_lead.name,
      'lead_email', v_lead.email
    )
  )
  returning id into v_confirmation_id;

  delete from public.leads where id = p_lead_id;

  return jsonb_build_object('success', true, 'confirmation_id', v_confirmation_id);
end;
$$;

revoke all on function public.confirm_lead_sale(uuid) from public;
grant execute on function public.confirm_lead_sale(uuid) to authenticated;
