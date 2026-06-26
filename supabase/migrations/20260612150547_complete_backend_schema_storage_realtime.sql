create extension if not exists pgcrypto with schema extensions;

alter table public.products
  drop constraint if exists products_status_check;

alter table public.products
  add constraint products_status_check
  check (status in ('active', 'paused', 'testing', 'archived', 'out_of_stock', 'sold_out'));

alter table public.sales_sessions
  drop constraint if exists sales_sessions_status_check;

alter table public.sales_sessions
  add constraint sales_sessions_status_check
  check (status in ('waiting_for_acceptance', 'waiting', 'accepted', 'in_progress', 'transferred', 'closed', 'ai_takeover'));

alter table public.support_sessions
  drop constraint if exists support_sessions_status_check;

alter table public.support_sessions
  add constraint support_sessions_status_check
  check (status in ('waiting_for_acceptance', 'waiting', 'accepted', 'in_progress', 'waiting_return', 'forwarded', 'resolved', 'unresolved', 'transferred', 'closed', 'ai_takeover'));

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  timezone text not null default 'America/Fortaleza',
  support_public_enabled boolean not null default true,
  sales_public_enabled boolean not null default true,
  ai_takeover_timeout_seconds integer not null default 45,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organization_settings_org_idx
  on public.organization_settings (organization_id);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists groups_org_name_idx
  on public.groups (organization_id, lower(name));

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  group_id uuid not null references public.groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists group_members_unique_idx
  on public.group_members (group_id, profile_id);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.group_permissions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists group_permissions_unique_idx
  on public.group_permissions (group_id, permission_id);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists product_categories_org_slug_idx
  on public.product_categories (organization_id, slug);

create table if not exists public.product_subcategories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  category_id uuid not null references public.product_categories(id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists product_subcategories_category_slug_idx
  on public.product_subcategories (category_id, slug);

create table if not exists public.product_support_reasons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  reason text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_knowledge_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_knowledge_embeddings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  knowledge_item_id uuid not null references public.product_knowledge_items(id) on delete cascade,
  provider text,
  model text,
  embedding jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.checkout_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  sales_session_id uuid references public.sales_sessions(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_confirmations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  sales_session_id uuid not null references public.sales_sessions(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  confirmed_by uuid,
  amount numeric,
  source text not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.continuity_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  support_session_id uuid not null references public.support_sessions(id) on delete cascade,
  code text not null unique,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid,
  internal_name text not null,
  display_name text not null,
  agent_type text not null,
  status text not null default 'active',
  prompt text,
  tone text,
  response_rules text,
  restrictions text,
  knowledge_base text,
  daily_message_limit integer,
  monthly_message_limit integer,
  daily_token_limit integer,
  monthly_token_limit integer,
  max_tokens_per_response integer,
  limit_action text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_agents_status_check
    check (status in ('active', 'paused', 'archived'))
);

create index if not exists ai_agents_org_status_idx
  on public.ai_agents (organization_id, status);

create table if not exists public.ai_agent_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  agent_id uuid references public.ai_agents(id) on delete set null,
  session_type text,
  session_id uuid,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  cost_estimate numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_bad_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  agent_id uuid references public.ai_agents(id) on delete set null,
  session_type text,
  session_id uuid,
  message_id uuid,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_provider_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  provider text not null,
  model text not null,
  status text not null,
  latency_ms integer,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  slug text not null,
  headline text,
  description text,
  banner_url text,
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_status_check
    check (status in ('draft', 'active', 'paused', 'finished', 'archived'))
);

create unique index if not exists campaigns_org_slug_idx
  on public.campaigns (organization_id, slug);

create table if not exists public.campaign_products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists campaign_products_unique_idx
  on public.campaign_products (campaign_id, product_id);

create table if not exists public.campaign_tracking_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  product_id uuid references public.products(id) on delete set null,
  event_type text not null,
  public_token text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  metric_date date not null,
  vitrine_accesses integer not null default 0,
  product_views integer not null default 0,
  leads integer not null default 0,
  checkouts_sent integer not null default 0,
  checkouts_accessed integer not null default 0,
  sales_confirmed integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists campaign_metrics_daily_unique_idx
  on public.campaign_metrics_daily (campaign_id, metric_date);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_type text not null,
  session_id uuid not null,
  rating integer,
  resolved_status text,
  comment text,
  created_at timestamptz not null default now(),
  constraint evaluations_rating_check
    check (rating is null or (rating >= 1 and rating <= 5))
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  movement_type text not null,
  quantity integer not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.human_message_warnings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  profile_id uuid references public.profiles(id) on delete set null,
  session_type text,
  session_id uuid,
  warning_type text not null,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_limits (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  key text not null,
  value numeric not null,
  created_at timestamptz not null default now()
);

create unique index if not exists plan_limits_unique_idx
  on public.plan_limits (plan_id, key);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  plan_id uuid references public.plans(id) on delete set null,
  status text not null default 'trialing',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  status text not null default 'draft',
  amount numeric,
  due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  invoice_id uuid references public.invoices(id) on delete set null,
  provider text,
  status text not null,
  amount numeric,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  key text not null,
  quantity numeric not null default 0,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.organization_settings enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.permissions enable row level security;
alter table public.group_permissions enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_subcategories enable row level security;
alter table public.product_support_reasons enable row level security;
alter table public.product_knowledge_items enable row level security;
alter table public.product_knowledge_embeddings enable row level security;
alter table public.checkout_events enable row level security;
alter table public.sales_confirmations enable row level security;
alter table public.continuity_codes enable row level security;
alter table public.ai_agents enable row level security;
alter table public.ai_agent_usage enable row level security;
alter table public.ai_bad_responses enable row level security;
alter table public.ai_provider_logs enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_products enable row level security;
alter table public.campaign_tracking_events enable row level security;
alter table public.campaign_metrics_daily enable row level security;
alter table public.evaluations enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.human_message_warnings enable row level security;
alter table public.plans enable row level security;
alter table public.plan_limits enable row level security;
alter table public.subscriptions enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.usage_records enable row level security;
alter table public.billing_events enable row level security;

create or replace function public.organization_read_policy(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select p_organization_id = public.current_user_organization_id()
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
    source
  )
  values (
    v_session.organization_id,
    v_session.id,
    v_session.product_id,
    auth.uid(),
    p_amount,
    'manual'
  )
  returning id into v_confirmation_id;

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
    jsonb_build_object('sales_session_id', v_session.id)
  );

  return jsonb_build_object('success', true, 'confirmation_id', v_confirmation_id);
end;
$$;

create or replace function public.send_sales_message(
  p_session_id uuid,
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
  select *
    into v_session
  from public.sales_sessions
  where id = p_session_id
    and status = 'in_progress'
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  limit 1;

  if v_session.id is null then
    raise exception 'Atendimento indisponível para envio.';
  end if;

  insert into public.sales_messages (
    organization_id,
    session_id,
    sender_type,
    sender_id,
    content
  )
  values (
    v_session.organization_id,
    v_session.id,
    'human',
    auth.uid()::text,
    trim(p_content)
  )
  returning id into v_message_id;

  return jsonb_build_object('success', true, 'message_id', v_message_id);
end;
$$;

create or replace function public.send_support_message(
  p_session_id uuid,
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
  select *
    into v_session
  from public.support_sessions
  where id = p_session_id
    and status = 'in_progress'
    and (
      accepted_by = auth.uid()::text
      or public.current_user_is_manager()
    )
  limit 1;

  if v_session.id is null then
    raise exception 'Suporte indisponível para envio.';
  end if;

  insert into public.support_messages (
    organization_id,
    session_id,
    sender_type,
    sender_id,
    content
  )
  values (
    v_session.organization_id,
    v_session.id,
    'human',
    auth.uid()::text,
    trim(p_content)
  )
  returning id into v_message_id;

  return jsonb_build_object('success', true, 'message_id', v_message_id);
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
    provider,
    model,
    base_url,
    is_active,
    temperature,
    max_output_tokens,
    timeout_seconds,
    fallback_enabled,
    fallback_provider,
    fallback_model,
    daily_token_limit,
    monthly_token_limit,
    daily_message_limit,
    monthly_message_limit,
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

create or replace function public.register_ai_usage(
  p_organization_id uuid,
  p_agent_id uuid default null,
  p_session_type text default null,
  p_session_id uuid default null,
  p_provider text default null,
  p_model text default null,
  p_input_tokens integer default 0,
  p_output_tokens integer default 0,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usage_id uuid;
begin
  insert into public.ai_usage_events (
    organization_id,
    agent_id,
    session_type,
    session_id,
    provider,
    model,
    input_tokens,
    output_tokens,
    metadata
  )
  values (
    p_organization_id,
    p_agent_id,
    p_session_type,
    p_session_id,
    p_provider,
    p_model,
    coalesce(p_input_tokens, 0),
    coalesce(p_output_tokens, 0),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_usage_id;

  return jsonb_build_object('success', true, 'usage_id', v_usage_id);
end;
$$;

create or replace function public.mark_bad_ai_response(
  p_organization_id uuid,
  p_agent_id uuid default null,
  p_session_type text default null,
  p_session_id uuid default null,
  p_message_id uuid default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_bad_response_id uuid;
begin
  if p_organization_id <> public.current_user_organization_id()
    and not public.current_user_is_manager() then
    raise exception 'Sem permissão para marcar resposta.';
  end if;

  insert into public.ai_bad_responses (
    organization_id,
    agent_id,
    session_type,
    session_id,
    message_id,
    reason
  )
  values (
    p_organization_id,
    p_agent_id,
    p_session_type,
    p_session_id,
    p_message_id,
    p_reason
  )
  returning id into v_bad_response_id;

  return jsonb_build_object('success', true, 'bad_response_id', v_bad_response_id);
end;
$$;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.notifications
  set read_at = now()
  where id = p_notification_id
    and organization_id = public.current_user_organization_id()
    and (recipient_id is null or recipient_id = auth.uid());

  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.mark_all_notifications_read()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.notifications
  set read_at = now()
  where organization_id = public.current_user_organization_id()
    and (recipient_id is null or recipient_id = auth.uid())
    and read_at is null;

  return jsonb_build_object('success', true);
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit)
values
  ('product-images', 'product-images', true, 52428800),
  ('campaign-banners', 'campaign-banners', true, 52428800),
  ('organization-logos', 'organization-logos', true, 10485760),
  ('avatars', 'avatars', true, 10485760),
  ('public-assets', 'public-assets', true, 52428800),
  ('support-attachments', 'support-attachments', false, 52428800)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Public assets are readable" on storage.objects;
create policy "Public assets are readable"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('product-images', 'campaign-banners', 'organization-logos', 'avatars', 'public-assets'));

drop policy if exists "Authenticated users upload organization assets" on storage.objects;
create policy "Authenticated users upload organization assets"
on storage.objects
for insert
to authenticated
with check (bucket_id in ('product-images', 'campaign-banners', 'organization-logos', 'avatars', 'public-assets', 'support-attachments'));

drop policy if exists "Authenticated users update organization assets" on storage.objects;
create policy "Authenticated users update organization assets"
on storage.objects
for update
to authenticated
using (bucket_id in ('product-images', 'campaign-banners', 'organization-logos', 'avatars', 'public-assets', 'support-attachments'))
with check (bucket_id in ('product-images', 'campaign-banners', 'organization-logos', 'avatars', 'public-assets', 'support-attachments'));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'campaign_tracking_events'
    ) then
      alter publication supabase_realtime add table public.campaign_tracking_events;
    end if;
  end if;
end;
$$;
