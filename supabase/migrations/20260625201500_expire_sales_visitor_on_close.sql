create or replace function public.close_sales_ticket(p_session_id uuid)
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
    status = 'closed',
    closed_at = now(),
    visitor_expires_at = now(),
    updated_at = now()
  where id = p_session_id
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  returning * into v_session;

  if v_session.id is null then
    raise exception 'Sem permissão para encerrar este atendimento.';
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id
  )
  values (
    v_session.organization_id,
    auth.uid(),
    'sales_ticket.closed',
    'sales_session',
    v_session.id
  );

  return jsonb_build_object('success', true);
end;
$$;
