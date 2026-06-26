create table if not exists public.organization_ai_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider text not null,
  model text not null,
  api_key_encrypted text,
  base_url text,
  is_active boolean not null default true,
  temperature numeric default 0.7,
  max_output_tokens integer default 800,
  timeout_seconds integer default 30,
  fallback_enabled boolean not null default false,
  fallback_provider text,
  fallback_model text,
  daily_token_limit integer,
  monthly_token_limit integer,
  daily_message_limit integer,
  monthly_message_limit integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_ai_settings_provider_check
    check (provider in ('openai', 'google', 'groq', 'openrouter', 'nvidia', 'anthropic')),
  constraint organization_ai_settings_fallback_provider_check
    check (
      fallback_provider is null
      or fallback_provider in ('openai', 'google', 'groq', 'openrouter', 'nvidia', 'anthropic')
    ),
  constraint organization_ai_settings_temperature_check
    check (temperature >= 0 and temperature <= 2),
  constraint organization_ai_settings_max_output_tokens_check
    check (max_output_tokens > 0),
  constraint organization_ai_settings_timeout_seconds_check
    check (timeout_seconds > 0),
  constraint organization_ai_settings_fallback_pair_check
    check (
      fallback_enabled = false
      or (fallback_provider is not null and fallback_model is not null)
    )
);

create unique index if not exists organization_ai_settings_active_org_idx
  on public.organization_ai_settings (organization_id)
  where is_active = true;

create index if not exists organization_ai_settings_org_idx
  on public.organization_ai_settings (organization_id);

alter table public.organization_ai_settings enable row level security;

comment on table public.organization_ai_settings is
  'Global AI provider/model settings per organization. Provider API keys must be encrypted/protected server-side and never exposed to clients.';

comment on column public.organization_ai_settings.organization_id is
  'References organizations(id) once the organizations table exists in this project schema.';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_organization_ai_settings_updated_at
  on public.organization_ai_settings;

create trigger set_organization_ai_settings_updated_at
before update on public.organization_ai_settings
for each row
execute function public.set_updated_at();

-- Fields provider/model/api_key on ai_agents, if they exist in older schemas,
-- are intentionally left untouched for safe migration and ignored by the frontend.
