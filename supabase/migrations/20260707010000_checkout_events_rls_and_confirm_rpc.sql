-- RLS policies for checkout_events (admin read + manager delete)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'checkout_events'
      and policyname = 'Checkout events visible to organization users'
  ) then
    create policy "Checkout events visible to organization users"
    on public.checkout_events
    for select
    to authenticated
    using (organization_id = public.current_user_organization_id());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'checkout_events'
      and policyname = 'Checkout events deletable by organization managers'
  ) then
    create policy "Checkout events deletable by organization managers"
    on public.checkout_events
    for delete
    to authenticated
    using (
      organization_id = public.current_user_organization_id()
      and public.current_user_is_manager()
    );
  end if;
end $$;

-- RPC to confirm a sale from a checkout click event
create or replace function public.confirm_checkout_sale(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.checkout_events%rowtype;
  v_product public.products%rowtype;
  v_confirmation_id uuid;
begin
  select * into v_event from public.checkout_events where id = p_event_id;
  if not found then
    return jsonb_build_object('success', false, 'error', 'Registro de checkout não encontrado.');
  end if;

  if v_event.organization_id <> public.current_user_organization_id() then
    return jsonb_build_object('success', false, 'error', 'Registro não pertence à organização.');
  end if;

  if not public.current_user_is_manager() then
    return jsonb_build_object('success', false, 'error', 'Sem permissão para confirmar vendas.');
  end if;

  select * into v_product from public.products where id = v_event.product_id;

  insert into public.sales_confirmations (
    organization_id,
    sales_session_id,
    product_id,
    confirmed_by,
    amount,
    source,
    metadata
  ) values (
    v_event.organization_id,
    v_event.sales_session_id,
    v_event.product_id,
    auth.uid()::text,
    v_product.price,
    'manual',
    jsonb_build_object(
      'checkout_event_id', v_event.id,
      'event_type', v_event.event_type,
      'event_metadata', v_event.metadata
    )
  )
  returning id into v_confirmation_id;

  delete from public.checkout_events where id = p_event_id;

  return jsonb_build_object('success', true, 'confirmation_id', v_confirmation_id);
end;
$$;

revoke all on function public.confirm_checkout_sale(uuid) from public;
grant execute on function public.confirm_checkout_sale(uuid) to authenticated;
