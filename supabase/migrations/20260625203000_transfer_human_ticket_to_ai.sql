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
    status = 'in_progress',
    accepted_by = 'ai',
    accepted_at = now(),
    opened_at = coalesce(opened_at, now()),
    ai_takeover_at = now(),
    handled_by_type = 'ai',
    updated_at = now()
  where id = p_session_id
    and status in ('accepted', 'in_progress')
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para transferir este atendimento para a IA.';
  end if;

  insert into public.sales_messages (
    organization_id,
    session_id,
    sender_type,
    content,
    metadata
  )
  values (
    v_session.organization_id,
    v_session.id,
    'ai',
    'Vou continuar seu atendimento por aqui e analisar a conversa para te responder da melhor forma.',
    jsonb_build_object('source', 'human_transfer_to_ai')
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
    'sales_ticket.transferred_to_ai',
    'sales_session',
    v_session.id,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'message', 'Atendimento transferido para a IA.'
  );
end;
$$;

create or replace function public.transfer_support_ticket(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
begin
  update public.support_sessions
  set
    status = 'in_progress',
    accepted_by = 'ai',
    accepted_at = now(),
    opened_at = coalesce(opened_at, now()),
    ai_takeover_at = now(),
    handled_by_type = 'ai',
    updated_at = now()
  where id = p_session_id
    and status in ('accepted', 'in_progress')
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para transferir este suporte para a IA.';
  end if;

  insert into public.support_messages (
    organization_id,
    session_id,
    sender_type,
    content,
    metadata
  )
  values (
    v_session.organization_id,
    v_session.id,
    'ai',
    'Vou continuar seu suporte por aqui e analisar sua solicitação para te orientar nos próximos passos.',
    jsonb_build_object('source', 'human_transfer_to_ai')
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
    'support_ticket.transferred_to_ai',
    'support_session',
    v_session.id,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'message', 'Suporte transferido para a IA.'
  );
end;
$$;
