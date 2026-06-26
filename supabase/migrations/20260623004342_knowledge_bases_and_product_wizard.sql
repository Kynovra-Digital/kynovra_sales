create extension if not exists unaccent with schema extensions;

alter table public.products
  add column if not exists subcategory text,
  add column if not exists product_type text,
  add column if not exists short_description text,
  add column if not exists commission_margin numeric,
  add column if not exists priority integer not null default 100,
  add column if not exists difficulty text,
  add column if not exists show_price_publicly boolean not null default true,
  add column if not exists stock_control_enabled boolean not null default false,
  add column if not exists public_headline text,
  add column if not exists public_benefits text,
  add column if not exists warranty text,
  add column if not exists public_cta text;

create table if not exists public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status text not null default 'draft',
  file_name text not null,
  file_size bigint not null default 0,
  mime_type text not null default 'text/markdown',
  storage_bucket text not null default 'knowledge-base-files',
  storage_path text not null,
  public_url text,
  content_text text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint knowledge_bases_status_check check (status in ('active', 'draft', 'archived')),
  constraint knowledge_bases_markdown_check check (lower(file_name) like '%.md'),
  unique (organization_id, storage_path)
);

create index if not exists knowledge_bases_org_status_idx
  on public.knowledge_bases (organization_id, status, updated_at desc);

create table if not exists public.product_knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  knowledge_base_id uuid not null references public.knowledge_bases(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (product_id, knowledge_base_id)
);

create index if not exists product_knowledge_bases_product_idx
  on public.product_knowledge_bases (organization_id, product_id);

alter table public.knowledge_bases enable row level security;
alter table public.product_knowledge_bases enable row level security;

grant select, insert, update, delete on table public.knowledge_bases to authenticated;
grant select, insert, update, delete on table public.product_knowledge_bases to authenticated;
grant all on table public.knowledge_bases to service_role;
grant all on table public.product_knowledge_bases to service_role;

create policy "Knowledge bases visible to organization users"
on public.knowledge_bases for select to authenticated
using (organization_id = public.current_user_organization_id());

create policy "Knowledge bases writable by organization managers"
on public.knowledge_bases for all to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
)
with check (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

create policy "Product knowledge links visible to organization users"
on public.product_knowledge_bases for select to authenticated
using (organization_id = public.current_user_organization_id());

create policy "Product knowledge links writable by organization managers"
on public.product_knowledge_bases for all to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
)
with check (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

drop trigger if exists set_knowledge_bases_updated_at on public.knowledge_bases;
create trigger set_knowledge_bases_updated_at
before update on public.knowledge_bases
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-base-files',
  'knowledge-base-files',
  false,
  5242880,
  array['text/markdown', 'text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Knowledge files visible to organization users"
on storage.objects for select to authenticated
using (
  bucket_id = 'knowledge-base-files'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
);

create policy "Knowledge files writable by organization managers"
on storage.objects for all to authenticated
using (
  bucket_id = 'knowledge-base-files'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
  and public.current_user_is_manager()
)
with check (
  bucket_id = 'knowledge-base-files'
  and (storage.foldername(name))[1] = public.current_user_organization_id()::text
  and public.current_user_is_manager()
  and lower(storage.filename(name)) like '%.md'
);

create or replace function public.generate_unique_product_slug(
  p_organization_id uuid,
  p_name text,
  p_exclude_product_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base text;
  v_slug text;
  v_suffix integer := 1;
begin
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  v_base := trim(both '-' from regexp_replace(
    lower(extensions.unaccent(trim(p_name))), '[^a-z0-9]+', '-', 'g'
  ));
  if v_base = '' then v_base := 'produto'; end if;
  v_slug := v_base;

  while exists (
    select 1 from public.products
    where organization_id = p_organization_id
      and slug = v_slug
      and (p_exclude_product_id is null or id <> p_exclude_product_id)
  ) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base || '-' || v_suffix::text;
  end loop;

  return v_slug;
end;
$$;

grant execute on function public.generate_unique_product_slug(uuid, text, uuid)
  to authenticated;

drop function if exists public.save_product_ai_configuration(
  uuid, uuid, jsonb, jsonb, text
);

create or replace function public.save_product_ai_configuration(
  p_organization_id uuid,
  p_product_id uuid,
  p_sales jsonb,
  p_support jsonb,
  p_knowledge_base_ids uuid[] default '{}'::uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_product_name text;
  v_sales_id uuid;
  v_support_id uuid;
begin
  if not public.current_user_is_manager() then
    raise exception 'Sem permissão para configurar IA do produto.';
  end if;
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  select name into v_product_name from public.products
  where id = p_product_id and organization_id = p_organization_id;
  if v_product_name is null then raise exception 'Produto não encontrado.'; end if;

  insert into public.ai_agents (
    organization_id, product_id, internal_name, display_name, agent_type,
    status, prompt, tone, response_rules, is_managed_by_product,
    enabled_tools, tool_permissions, initial_message, fallback_message,
    common_topics, resolution_steps
  ) values (
    p_organization_id, p_product_id, 'sales-' || p_product_id::text,
    coalesce(nullif(p_sales->>'display_name', ''), v_product_name || ' Vendas'),
    'sales', case when coalesce((p_sales->>'enabled')::boolean, false) then 'active' else 'paused' end,
    nullif(p_sales->>'prompt', ''), nullif(p_sales->>'tone', ''), nullif(p_sales->>'rules', ''), true,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_sales->'enabled_tools', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_sales->'tool_permissions', '{}'::jsonb), nullif(p_sales->>'initial_message', ''),
    nullif(p_sales->>'fallback_message', ''), null, null
  )
  on conflict (organization_id, product_id, agent_type)
    where is_managed_by_product = true and product_id is not null
  do update set
    display_name = excluded.display_name, status = excluded.status,
    prompt = excluded.prompt, tone = excluded.tone,
    response_rules = excluded.response_rules, restrictions = null,
    enabled_tools = excluded.enabled_tools, tool_permissions = excluded.tool_permissions,
    initial_message = excluded.initial_message, fallback_message = excluded.fallback_message,
    common_topics = null, resolution_steps = null, updated_at = now()
  returning id into v_sales_id;

  insert into public.ai_agents (
    organization_id, product_id, internal_name, display_name, agent_type,
    status, prompt, tone, response_rules, is_managed_by_product,
    enabled_tools, tool_permissions, initial_message, fallback_message,
    common_topics, resolution_steps
  ) values (
    p_organization_id, p_product_id, 'support-' || p_product_id::text,
    coalesce(nullif(p_support->>'display_name', ''), v_product_name || ' Suporte'),
    'support', case when coalesce((p_support->>'enabled')::boolean, false) then 'active' else 'paused' end,
    nullif(p_support->>'prompt', ''), nullif(p_support->>'tone', ''), nullif(p_support->>'rules', ''), true,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_support->'enabled_tools', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_support->'tool_permissions', '{}'::jsonb), nullif(p_support->>'initial_message', ''),
    nullif(p_support->>'fallback_message', ''), null, null
  )
  on conflict (organization_id, product_id, agent_type)
    where is_managed_by_product = true and product_id is not null
  do update set
    display_name = excluded.display_name, status = excluded.status,
    prompt = excluded.prompt, tone = excluded.tone,
    response_rules = excluded.response_rules, restrictions = null,
    enabled_tools = excluded.enabled_tools, tool_permissions = excluded.tool_permissions,
    initial_message = excluded.initial_message, fallback_message = excluded.fallback_message,
    common_topics = null, resolution_steps = null, updated_at = now()
  returning id into v_support_id;

  delete from public.product_knowledge_bases
  where organization_id = p_organization_id and product_id = p_product_id;

  insert into public.product_knowledge_bases (
    organization_id, product_id, knowledge_base_id
  )
  select p_organization_id, p_product_id, kb.id
  from public.knowledge_bases kb
  where kb.organization_id = p_organization_id
    and kb.id = any(coalesce(p_knowledge_base_ids, '{}'::uuid[]))
    and kb.status <> 'archived'
  on conflict (product_id, knowledge_base_id) do nothing;

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    p_organization_id, auth.uid(), 'product.ai_configuration_saved',
    'products', p_product_id,
    jsonb_build_object(
      'sales_agent_id', v_sales_id,
      'support_agent_id', v_support_id,
      'knowledge_base_ids', coalesce(p_knowledge_base_ids, '{}'::uuid[])
    )
  );

  return jsonb_build_object(
    'success', true,
    'sales_agent_id', v_sales_id,
    'support_agent_id', v_support_id
  );
end;
$$;

grant execute on function public.save_product_ai_configuration(uuid, uuid, jsonb, jsonb, uuid[])
  to authenticated;
