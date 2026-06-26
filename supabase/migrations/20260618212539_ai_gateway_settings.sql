alter table public.organization_ai_settings
  add column if not exists model_id text,
  add column if not exists fallback_model_id text,
  add column if not exists ai_auto_takeover_enabled boolean not null default true,
  add column if not exists human_accept_timeout_seconds integer not null default 60;

update public.organization_ai_settings
set
  model_id = coalesce(model_id, model),
  fallback_model_id = coalesce(fallback_model_id, fallback_model)
where model_id is null
  or (fallback_model is not null and fallback_model_id is null);

alter table public.organization_ai_settings
  alter column model_id set not null;

alter table public.organization_ai_settings
  drop constraint if exists organization_ai_settings_provider_check,
  drop constraint if exists organization_ai_settings_fallback_provider_check,
  drop constraint if exists organization_ai_settings_fallback_pair_check;

alter table public.organization_ai_settings
  add constraint organization_ai_settings_gateway_fallback_pair_check
    check (
      fallback_enabled = false
      or fallback_model_id is not null
    );

comment on column public.organization_ai_settings.model_id is
  'Vercel AI Gateway model id used globally by the organization.';

comment on column public.organization_ai_settings.fallback_model_id is
  'Optional Vercel AI Gateway fallback model id.';

comment on column public.organization_ai_settings.provider is
  'Deprecated. Kept for compatibility while AI runs through Vercel AI Gateway.';

comment on column public.organization_ai_settings.model is
  'Deprecated. Mirrors model_id for compatibility.';

comment on column public.organization_ai_settings.api_key_encrypted is
  'Deprecated. Provider keys are no longer stored here. Use Supabase secret AI_GATEWAY_API_KEY.';

comment on column public.organization_ai_settings.base_url is
  'Deprecated. AI Gateway endpoint is fixed server-side.';

create or replace function public.save_global_ai_settings(
  p_organization_id uuid,
  p_model_id text,
  p_temperature numeric default 0.7,
  p_max_output_tokens integer default 800,
  p_timeout_seconds integer default 30,
  p_fallback_enabled boolean default false,
  p_fallback_model_id text default null,
  p_ai_auto_takeover_enabled boolean default true,
  p_human_accept_timeout_seconds integer default 60
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_settings_id uuid;
begin
  if not public.current_user_is_manager() then
    raise exception 'Sem permissão para alterar configurações de IA.';
  end if;

  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  if nullif(trim(p_model_id), '') is null then
    raise exception 'Modelo de IA obrigatório.';
  end if;

  insert into public.organization_ai_settings (
    organization_id,
    provider,
    model,
    model_id,
    api_key_encrypted,
    base_url,
    temperature,
    max_output_tokens,
    timeout_seconds,
    fallback_enabled,
    fallback_provider,
    fallback_model,
    fallback_model_id,
    ai_auto_takeover_enabled,
    human_accept_timeout_seconds
  )
  values (
    p_organization_id,
    'gateway',
    p_model_id,
    p_model_id,
    null,
    null,
    p_temperature,
    p_max_output_tokens,
    p_timeout_seconds,
    p_fallback_enabled,
    null,
    p_fallback_model_id,
    p_fallback_model_id,
    p_ai_auto_takeover_enabled,
    p_human_accept_timeout_seconds
  )
  on conflict (organization_id) where is_active = true
  do update set
    provider = 'gateway',
    model = excluded.model_id,
    model_id = excluded.model_id,
    api_key_encrypted = null,
    base_url = null,
    temperature = excluded.temperature,
    max_output_tokens = excluded.max_output_tokens,
    timeout_seconds = excluded.timeout_seconds,
    fallback_enabled = excluded.fallback_enabled,
    fallback_provider = null,
    fallback_model = excluded.fallback_model_id,
    fallback_model_id = excluded.fallback_model_id,
    ai_auto_takeover_enabled = excluded.ai_auto_takeover_enabled,
    human_accept_timeout_seconds = excluded.human_accept_timeout_seconds,
    updated_at = now()
  returning id into v_settings_id;

  insert into public.audit_logs (
    organization_id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    p_organization_id,
    auth.uid(),
    'organization_ai_settings.gateway_updated',
    'organization_ai_settings',
    v_settings_id,
    jsonb_build_object(
      'model_id', p_model_id,
      'fallback_enabled', p_fallback_enabled,
      'fallback_model_id', p_fallback_model_id
    )
  );

  return jsonb_build_object('success', true, 'settings_id', v_settings_id);
end;
$$;

create or replace function public.get_global_ai_settings(p_organization_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_settings record;
begin
  if p_organization_id <> public.current_user_organization_id()
    and not public.current_user_is_manager() then
    raise exception 'Sem permissão para acessar configuração de IA.';
  end if;

  select
    id,
    organization_id,
    model_id,
    model_id as model,
    'gateway'::text as provider,
    is_active,
    temperature,
    max_output_tokens,
    timeout_seconds,
    fallback_enabled,
    fallback_model_id,
    fallback_model_id as fallback_model,
    daily_token_limit,
    monthly_token_limit,
    daily_message_limit,
    monthly_message_limit,
    ai_auto_takeover_enabled,
    human_accept_timeout_seconds,
    created_at,
    updated_at
  into v_settings
  from public.organization_ai_settings
  where organization_id = p_organization_id
    and is_active = true
  limit 1;

  if v_settings.id is null then
    return jsonb_build_object('configured', false);
  end if;

  return to_jsonb(v_settings) || jsonb_build_object('configured', true);
end;
$$;
