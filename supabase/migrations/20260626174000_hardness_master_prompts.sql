create table if not exists public.hardness_master_prompts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sales_master_prompt text not null default '',
  support_master_prompt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint hardness_master_prompts_organization_unique unique (organization_id)
);

alter table public.hardness_master_prompts enable row level security;

grant select, insert, update on table public.hardness_master_prompts to authenticated;
grant all on table public.hardness_master_prompts to service_role;

drop policy if exists "Users can read own organization hardness prompts"
  on public.hardness_master_prompts;

create policy "Users can read own organization hardness prompts"
on public.hardness_master_prompts
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Managers can manage own organization hardness prompts"
  on public.hardness_master_prompts;

create policy "Managers can manage own organization hardness prompts"
on public.hardness_master_prompts
for all
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and (
    public.current_user_is_owner()
    or public.current_user_is_manager()
    or public.current_user_has_permission('ai.settings.manage')
    or public.current_user_has_permission('products.manage')
  )
)
with check (
  organization_id = public.current_user_organization_id()
  and (
    public.current_user_is_owner()
    or public.current_user_is_manager()
    or public.current_user_has_permission('ai.settings.manage')
    or public.current_user_has_permission('products.manage')
  )
);

create or replace function public.touch_hardness_master_prompts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists hardness_master_prompts_touch_updated_at
  on public.hardness_master_prompts;

create trigger hardness_master_prompts_touch_updated_at
before update on public.hardness_master_prompts
for each row
execute function public.touch_hardness_master_prompts_updated_at();

create or replace function public.get_hardness_master_prompts(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_record public.hardness_master_prompts%rowtype;
begin
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  select *
  into v_record
  from public.hardness_master_prompts
  where organization_id = p_organization_id;

  if v_record.id is null then
    return jsonb_build_object(
      'id', null,
      'organization_id', p_organization_id,
      'sales_master_prompt', '',
      'support_master_prompt', '',
      'created_at', null,
      'updated_at', null,
      'updated_by', null
    );
  end if;

  return to_jsonb(v_record);
end;
$$;

create or replace function public.save_hardness_master_prompts(
  p_organization_id uuid,
  p_sales_master_prompt text,
  p_support_master_prompt text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_record public.hardness_master_prompts%rowtype;
begin
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  if not (
    public.current_user_is_owner()
    or public.current_user_is_manager()
    or public.current_user_has_permission('ai.settings.manage')
    or public.current_user_has_permission('products.manage')
  ) then
    raise exception 'Sem permissão para salvar Hardness.';
  end if;

  insert into public.hardness_master_prompts (
    organization_id,
    sales_master_prompt,
    support_master_prompt,
    updated_by
  )
  values (
    p_organization_id,
    coalesce(p_sales_master_prompt, ''),
    coalesce(p_support_master_prompt, ''),
    auth.uid()
  )
  on conflict (organization_id)
  do update set
    sales_master_prompt = excluded.sales_master_prompt,
    support_master_prompt = excluded.support_master_prompt,
    updated_by = auth.uid()
  returning * into v_record;

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
    'hardness.master_prompts_saved',
    'hardness_master_prompts',
    v_record.id,
    '{}'::jsonb
  );

  return to_jsonb(v_record);
end;
$$;

grant execute on function public.get_hardness_master_prompts(uuid)
  to authenticated;
grant execute on function public.save_hardness_master_prompts(uuid, text, text)
  to authenticated;
