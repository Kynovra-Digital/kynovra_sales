create or replace function public.get_public_sales_messages(p_public_token text)
returns setof public.sales_messages
language sql
security definer
set search_path = public, auth
as $$
  select sm.*
  from public.sales_messages sm
  join public.sales_sessions ss on ss.id = sm.session_id
  where ss.public_token = p_public_token
  order by sm.created_at asc;
$$;

create or replace function public.send_public_sales_message(
  p_public_token text,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
  v_message_id uuid;
begin
  select * into v_session
  from public.sales_sessions
  where public_token = p_public_token
    and status in ('in_progress', 'ai_takeover')
  limit 1;

  if v_session.id is null then
    raise exception 'O atendimento ainda não foi iniciado.';
  end if;

  insert into public.sales_messages (
    organization_id,
    session_id,
    sender_type,
    sender_id,
    content,
    metadata
  )
  values (
    v_session.organization_id,
    v_session.id,
    'customer',
    v_session.public_token,
    p_content,
    '{}'::jsonb
  )
  returning id into v_message_id;

  return jsonb_build_object('success', true, 'message_id', v_message_id);
end;
$$;

create or replace function public.get_public_support_messages(
  p_public_token text
)
returns setof public.support_messages
language sql
security definer
set search_path = public, auth
as $$
  select sm.*
  from public.support_messages sm
  join public.support_sessions ss on ss.id = sm.session_id
  where ss.public_token = p_public_token
  order by sm.created_at asc;
$$;

create or replace function public.send_public_support_message(
  p_public_token text,
  p_content text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_session record;
  v_message_id uuid;
begin
  select * into v_session
  from public.support_sessions
  where public_token = p_public_token
    and status in ('in_progress', 'ai_takeover')
  limit 1;

  if v_session.id is null then
    raise exception 'O suporte ainda não foi iniciado.';
  end if;

  insert into public.support_messages (
    organization_id,
    session_id,
    sender_type,
    sender_id,
    content,
    metadata
  )
  values (
    v_session.organization_id,
    v_session.id,
    'customer',
    v_session.public_token,
    p_content,
    '{}'::jsonb
  )
  returning id into v_message_id;

  return jsonb_build_object('success', true, 'message_id', v_message_id);
end;
$$;

grant execute on function public.get_public_sales_messages(text)
to anon, authenticated;

grant execute on function public.send_public_sales_message(text, text)
to anon, authenticated;

grant execute on function public.get_public_support_messages(text)
to anon, authenticated;

grant execute on function public.send_public_support_message(text, text)
to anon, authenticated;
