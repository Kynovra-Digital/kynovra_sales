create or replace function public.take_over_ai_sales_ticket(p_session_id uuid)
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
    accepted_by = auth.uid()::text,
    accepted_at = now(),
    handled_by_type = 'human',
    updated_at = now()
  where id = p_session_id
    and status = 'in_progress'
    and accepted_by = 'ai'
    and handled_by_type = 'ai'
    and organization_id = public.current_user_organization_id()
  returning * into v_session;

  if v_session.id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Este atendimento não está mais sob controle da IA.'
    );
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
    'sales_ticket.ai_taken_over_by_human',
    'sales_session',
    v_session.id,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'message', 'Atendimento transferido da IA para você.'
  );
end;
$$;

create or replace function public.take_over_ai_support_ticket(p_session_id uuid)
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
    accepted_by = auth.uid()::text,
    accepted_at = now(),
    handled_by_type = 'human',
    updated_at = now()
  where id = p_session_id
    and status = 'in_progress'
    and accepted_by = 'ai'
    and handled_by_type = 'ai'
    and organization_id = public.current_user_organization_id()
  returning * into v_session;

  if v_session.id is null then
    return jsonb_build_object(
      'success', false,
      'message', 'Este suporte não está mais sob controle da IA.'
    );
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
    'support_ticket.ai_taken_over_by_human',
    'support_session',
    v_session.id,
    '{}'::jsonb
  );

  return jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'message', 'Suporte transferido da IA para você.'
  );
end;
$$;

grant execute on function public.take_over_ai_sales_ticket(uuid) to authenticated;
grant execute on function public.take_over_ai_support_ticket(uuid) to authenticated;

drop policy if exists "Sales queue visible to operators" on public.sales_sessions;
create policy "Sales queue visible to operators"
on public.sales_sessions
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    (status = 'waiting' and accepted_by is null and public.current_user_is_operator())
    or (status = 'in_progress' and accepted_by = 'ai' and handled_by_type = 'ai' and public.current_user_is_operator())
    or accepted_by = auth.uid()::text
    or public.current_user_is_manager()
  )
);

drop policy if exists "Support queue visible to operators" on public.support_sessions;
create policy "Support queue visible to operators"
on public.support_sessions
for select
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    (status = 'waiting' and accepted_by is null and public.current_user_is_operator())
    or (status = 'in_progress' and accepted_by = 'ai' and handled_by_type = 'ai' and public.current_user_is_operator())
    or accepted_by = auth.uid()::text
    or public.current_user_is_manager()
  )
);
