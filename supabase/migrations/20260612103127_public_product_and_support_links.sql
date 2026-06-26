create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  slug text not null,
  image_url text,
  category text,
  price numeric,
  status text not null default 'active',
  main_benefit text,
  support_info text,
  checkout_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_status_check
    check (status in ('active', 'paused', 'sold_out', 'archived'))
);

create unique index if not exists products_organization_slug_idx
  on public.products (organization_id, slug);

create index if not exists products_organization_status_idx
  on public.products (organization_id, status);

alter table public.products enable row level security;

create table if not exists public.sales_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null,
  lead_id uuid,
  session_code text not null,
  public_token text not null,
  status text not null default 'waiting',
  handled_by_type text,
  accepted_by text,
  accepted_at timestamptz,
  opened_at timestamptz,
  ai_takeover_at timestamptz,
  closed_at timestamptz,
  source text not null default 'product_public_link',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_sessions_status_check
    check (status in ('waiting_for_acceptance', 'waiting', 'accepted', 'in_progress', 'ai_takeover', 'transferred', 'closed')),
  constraint sales_sessions_handled_by_type_check
    check (handled_by_type is null or handled_by_type in ('human', 'ai')),
  constraint sales_sessions_source_check
    check (source in ('product_public_link', 'manual', 'campaign'))
);

create unique index if not exists sales_sessions_public_token_idx
  on public.sales_sessions (public_token);

create index if not exists sales_sessions_queue_idx
  on public.sales_sessions (organization_id, status, accepted_by);

create index if not exists sales_sessions_product_idx
  on public.sales_sessions (product_id);

alter table public.sales_sessions enable row level security;

create table if not exists public.support_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid,
  public_token text not null,
  continuity_code text,
  reason text not null,
  custom_reason text,
  status text not null default 'waiting',
  handled_by_type text,
  accepted_by text,
  accepted_at timestamptz,
  opened_at timestamptz,
  ai_takeover_at timestamptz,
  closed_at timestamptz,
  source text not null default 'support_public_link',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_sessions_status_check
    check (status in ('waiting_for_acceptance', 'waiting', 'accepted', 'in_progress', 'ai_takeover', 'transferred', 'closed')),
  constraint support_sessions_handled_by_type_check
    check (handled_by_type is null or handled_by_type in ('human', 'ai')),
  constraint support_sessions_source_check
    check (source in ('support_public_link', 'manual'))
);

create unique index if not exists support_sessions_public_token_idx
  on public.support_sessions (public_token);

create unique index if not exists support_sessions_continuity_code_idx
  on public.support_sessions (continuity_code)
  where continuity_code is not null;

create index if not exists support_sessions_queue_idx
  on public.support_sessions (organization_id, status, accepted_by);

alter table public.support_sessions enable row level security;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_sales_sessions_updated_at on public.sales_sessions;
create trigger set_sales_sessions_updated_at
before update on public.sales_sessions
for each row
execute function public.set_updated_at();

drop trigger if exists set_support_sessions_updated_at on public.support_sessions;
create trigger set_support_sessions_updated_at
before update on public.support_sessions
for each row
execute function public.set_updated_at();

comment on column public.sales_sessions.public_token is
  'Opaque hard-to-guess token used in /room/[publicToken]. Never expose internal ids in public URLs.';

comment on column public.support_sessions.public_token is
  'Opaque hard-to-guess token used in /suporte/sala/[publicToken]. Never expose internal ids in public URLs.';
