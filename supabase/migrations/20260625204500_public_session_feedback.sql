alter table public.evaluations
  add column if not exists ratings jsonb not null default '{}'::jsonb;

create or replace function public.submit_public_session_feedback(
  p_public_token text,
  p_session_type text,
  p_ratings jsonb,
  p_comment text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session record;
  v_rating integer;
  v_existing_id uuid;
begin
  if p_session_type not in ('sales', 'support') then
    raise exception 'Tipo de sessão inválido.';
  end if;

  if p_session_type = 'sales' then
    select id, organization_id, status
      into v_session
    from public.sales_sessions
    where public_token = p_public_token
    limit 1;
  else
    select id, organization_id, status
      into v_session
    from public.support_sessions
    where public_token = p_public_token
    limit 1;
  end if;

  if v_session.id is null then
    raise exception 'Sala não encontrada.';
  end if;

  if v_session.status <> 'closed' then
    raise exception 'Avaliação disponível apenas após encerramento.';
  end if;

  v_rating := greatest(
    1,
    least(
      5,
      round(
        (
          coalesce((p_ratings->>'overall')::numeric, 0) +
          coalesce((p_ratings->>'clarity')::numeric, 0) +
          coalesce((p_ratings->>'speed')::numeric, 0)
        ) / 3
      )::integer
    )
  );

  select id
    into v_existing_id
  from public.evaluations
  where session_id = v_session.id
    and session_type = p_session_type
  limit 1;

  if v_existing_id is null then
    insert into public.evaluations (
      organization_id,
      session_type,
      session_id,
      rating,
      ratings,
      comment,
      resolved_status
    )
    values (
      v_session.organization_id,
      p_session_type,
      v_session.id,
      v_rating,
      p_ratings,
      nullif(trim(coalesce(p_comment, '')), ''),
      'customer_feedback'
    );
  else
    update public.evaluations
    set
      rating = v_rating,
      ratings = p_ratings,
      comment = nullif(trim(coalesce(p_comment, '')), ''),
      resolved_status = 'customer_feedback'
    where id = v_existing_id;
  end if;

  return jsonb_build_object('success', true);
end;
$$;

grant execute on function public.submit_public_session_feedback(text, text, jsonb, text)
to anon, authenticated;
