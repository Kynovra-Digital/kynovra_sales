create or replace function public.transfer_sales_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.sales_sessions
  set
    status = 'waiting',
    accepted_by = null,
    accepted_at = null,
    opened_at = null,
    ai_takeover_at = null,
    handled_by_type = null,
    updated_at = now()
  where id = p_session_id
    and status in ('accepted', 'in_progress')
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para transferir este atendimento para a fila.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sales_ticket.transferred_to_queue',
    'sales_session',
    v_session.id,
    jsonb_build_object('previous_status', v_session.status)
  );

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'message', 'Atendimento devolvido para a fila de aceite.'
  );
end;
$$;

create or replace function public.confirm_manual_sale(
  p_session_id uuid,
  p_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
  v_confirmation_id uuid;
begin
  select *
    into v_session
  from public.sales_sessions
  where id = p_session_id
    and status in ('accepted', 'in_progress')
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  limit 1;

  if v_session.id is null then
    raise exception 'Sem permissão para confirmar esta venda.';
  end if;

  insert into public.sales_confirmations (
    organization_id,
    sales_session_id,
    product_id,
    confirmed_by,
    amount,
    source,
    metadata
  )
  values (
    v_session.organization_id,
    v_session.id,
    v_session.product_id,
    auth.uid(),
    p_amount,
    'manual',
    jsonb_build_object('closed_positively', true)
  )
  returning id into v_confirmation_id;

  update public.sales_sessions
  set
    status = 'closed',
    closed_at = now(),
    visitor_expires_at = now(),
    updated_at = now()
  where id = v_session.id;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sale.manually_confirmed',
    'sales_confirmation',
    v_confirmation_id,
    jsonb_build_object(
      'sales_session_id', v_session.id,
      'closed_positively', true,
      'previous_status', v_session.status
    )
  );

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sales_ticket.closed_positive',
    'sales_session',
    v_session.id,
    jsonb_build_object('confirmation_id', v_confirmation_id)
  );

  return jsonb_build_object(
    'success', true,
    'confirmation_id', v_confirmation_id,
    'session_id', v_session.id,
    'message', 'Venda confirmada e atendimento encerrado positivamente.'
  );
end;
$$;

create or replace function public.ai_takeover_waiting_sessions(
  p_timeout_seconds integer default 45
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sales_count integer := 0;
  v_support_count integer := 0;
begin
  with updated_sales as (
    update public.sales_sessions
    set
      status = 'in_progress',
      accepted_by = 'ai',
      accepted_at = now(),
      opened_at = now(),
      ai_takeover_at = now(),
      handled_by_type = 'ai',
      updated_at = now()
    where status = 'waiting'
      and accepted_by is null
      and coalesce(updated_at, created_at) <= now() - make_interval(secs => p_timeout_seconds)
    returning id, organization_id
  ),
  inserted_sales_messages as (
    insert into public.sales_messages (
      organization_id,
      session_id,
      sender_type,
      content,
      metadata
    )
    select
      organization_id,
      id,
      'ai',
      'Olá, tudo bem? Seu atendimento já foi iniciado. Vou te ajudar com as informações do produto e a finalização da compra.',
      jsonb_build_object('source', 'ai_takeover_waiting_session')
    from updated_sales
    returning id
  )
  select count(*) into v_sales_count from inserted_sales_messages;

  with updated_support as (
    update public.support_sessions
    set
      status = 'in_progress',
      accepted_by = 'ai',
      accepted_at = now(),
      opened_at = now(),
      ai_takeover_at = now(),
      handled_by_type = 'ai',
      updated_at = now()
    where status = 'waiting'
      and accepted_by is null
      and coalesce(updated_at, created_at) <= now() - make_interval(secs => p_timeout_seconds)
    returning id, organization_id
  ),
  inserted_support_messages as (
    insert into public.support_messages (
      organization_id,
      session_id,
      sender_type,
      content,
      metadata
    )
    select
      organization_id,
      id,
      'ai',
      'Olá, tudo bem? Seu atendimento já foi iniciado. Vou analisar sua solicitação e te ajudar com os próximos passos.',
      jsonb_build_object('source', 'ai_takeover_waiting_session')
    from updated_support
    returning id
  )
  select count(*) into v_support_count from inserted_support_messages;

  return jsonb_build_object(
    'success', true,
    'sales_takeovers', v_sales_count,
    'support_takeovers', v_support_count
  );
end;
$$;

grant execute on function public.transfer_sales_ticket(uuid) to authenticated;
grant execute on function public.confirm_manual_sale(uuid, numeric) to authenticated;
revoke all on function public.ai_takeover_waiting_sessions(integer) from public, anon, authenticated;
grant execute on function public.ai_takeover_waiting_sessions(integer) to service_role;
