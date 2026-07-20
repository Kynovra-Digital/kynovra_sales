-- Consolidar IA no AI Gateway FreeTokenFaucet: modelo deepseek-v4-flash.
-- Convenção: provider físico no front fica "siliconflow" para preservar constraint/RPC legada,
-- mas o backend aponta para https://freetokenfaucet.com/v1 via FREETOKENFAUCET_API_KEY.

-- 1. Migra configurações ativas legadas de modelo antigo para deepseek-v4-flash
update public.organization_ai_settings
  set model = 'deepseek-v4-flash',
      model_id = 'deepseek-v4-flash',
      updated_at = now()
  where provider = 'siliconflow'
    and coalesce(model_id, model) <> 'deepseek-v4-flash';

-- 2. Atualiza constraint: mantém apenas siliconflow como chave de provider (camada de abstração)
-- (Constraint existente já permite só 'siliconflow'; sem mudança.)

-- 3. Recria RPC save_global_ai_settings para aceitar deepseek-v4-flash
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

  if p_model_id <> 'deepseek-v4-flash' then
    raise exception 'Modelo inválido para o AI Gateway.';
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

-- Mantém mesma assinatura: pode reusar a grant anterior.
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

-- 4. Limpa qualquer fallback_provider inválido restante
update public.organization_ai_settings
  set fallback_provider = null,
      fallback_model = null,
      fallback_model_id = null,
      fallback_enabled = false,
      updated_at = now()
  where fallback_provider is not null
    and fallback_provider <> 'siliconflow';

-- 5. Migra registros legados do modelo antigo para o novo
update public.organization_ai_settings
  set fallback_model = 'deepseek-v4-flash',
      fallback_model_id = 'deepseek-v4-flash',
      updated_at = now()
  where fallback_enabled = true
    and coalesce(fallback_model_id, fallback_model) = 'deepseek-ai/DeepSeek-V4-Flash';
