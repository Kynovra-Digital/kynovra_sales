-- Consolidar provedores de IA: apenas SiliconFlow.
-- Remover Vercel AI Gateway, TheProxy, AgentRouter e OpenRouter do constraint e da RPC.

-- 1. Migra dados existentes para SiliconFlow + DeepSeek V4 Flash
update public.organization_ai_settings
  set provider = 'siliconflow',
      model = 'deepseek-ai/DeepSeek-V4-Flash',
      model_id = 'deepseek-ai/DeepSeek-V4-Flash',
      fallback_provider = null,
      fallback_model = null,
      fallback_model_id = null,
      fallback_enabled = false,
      updated_at = now()
  where provider in ('vercel', 'theproxy', 'agentrouter', 'openrouter');

-- 2. Atualiza constraint do provider
alter table public.organization_ai_settings
  drop constraint if exists organization_ai_settings_provider_check;

alter table public.organization_ai_settings
  add constraint organization_ai_settings_provider_check
    check (provider in ('siliconflow'));

-- 3. Recria RPC save_global_ai_settings com apenas SiliconFlow
drop function if exists public.save_global_ai_settings(
  uuid, text, text, numeric, integer, integer, boolean, text, boolean, integer
);

create or replace function public.save_global_ai_settings(
  p_organization_id uuid,
  p_model_id text,
  p_provider text default 'siliconflow',
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
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if not (
    public.current_user_is_manager()
    or public.current_user_has_permission('settings.manage')
    or public.current_user_has_permission('ai.settings.manage')
  ) then
    raise exception 'Sem permissão para alterar configurações de IA.';
  end if;

  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  if p_provider <> 'siliconflow' then
    raise exception 'Provedor de IA inválido.';
  end if;

  if nullif(trim(p_model_id), '') is null then
    raise exception 'Modelo de IA obrigatório.';
  end if;

  if p_model_id <> 'deepseek-ai/DeepSeek-V4-Flash' then
    raise exception 'Modelo inválido para SiliconFlow.';
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
    p_provider,
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
    provider = excluded.provider,
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
    'organization_ai_settings.provider_updated',
    'organization_ai_settings',
    v_settings_id,
    jsonb_build_object(
      'provider', p_provider,
      'model_id', p_model_id,
      'fallback_enabled', p_fallback_enabled,
      'fallback_model_id', p_fallback_model_id
    )
  );

  return jsonb_build_object('success', true, 'settings_id', v_settings_id);
end;
$$;

grant execute on function public.save_global_ai_settings(
  uuid,
  text,
  text,
  numeric,
  integer,
  integer,
  boolean,
  text,
  boolean,
  integer
) to authenticated;

-- 4. Limpa fallback_provider inválidos de registros legados
update public.organization_ai_settings
  set fallback_provider = null,
      fallback_model = null,
      fallback_model_id = null,
      fallback_enabled = false,
      updated_at = now()
  where fallback_provider is not null
    and fallback_provider <> 'siliconflow';
