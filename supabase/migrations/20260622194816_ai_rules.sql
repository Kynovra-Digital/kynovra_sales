create table if not exists public.ai_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  rule_type text not null default 'general',
  instructions text not null,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_rules_status_check check (status in ('active', 'paused', 'archived')),
  constraint ai_rules_priority_check check (priority >= 0)
);

create index if not exists ai_rules_organization_status_idx
  on public.ai_rules (organization_id, status, priority);

alter table public.ai_rules enable row level security;

create policy "AI rules visible to organization users"
on public.ai_rules for select to authenticated
using (organization_id = public.current_user_organization_id());

create policy "AI rules writable by organization managers"
on public.ai_rules for all to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
)
with check (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

drop trigger if exists set_ai_rules_updated_at on public.ai_rules;
create trigger set_ai_rules_updated_at
before update on public.ai_rules
for each row execute function public.set_updated_at();
