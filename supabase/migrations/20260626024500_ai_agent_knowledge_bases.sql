create table if not exists public.ai_agent_knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid not null references public.ai_agents(id) on delete cascade,
  knowledge_base_id uuid not null references public.knowledge_bases(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (agent_id, knowledge_base_id)
);

create index if not exists ai_agent_knowledge_bases_agent_idx
  on public.ai_agent_knowledge_bases (agent_id);

create index if not exists ai_agent_knowledge_bases_knowledge_base_idx
  on public.ai_agent_knowledge_bases (knowledge_base_id);

alter table public.ai_agent_knowledge_bases enable row level security;

drop policy if exists "Users can read agent knowledge bases from own organization"
  on public.ai_agent_knowledge_bases;

create policy "Users can read agent knowledge bases from own organization"
on public.ai_agent_knowledge_bases
for select
to authenticated
using (organization_id = public.current_user_organization_id());

drop policy if exists "Managers can manage agent knowledge bases from own organization"
  on public.ai_agent_knowledge_bases;

create policy "Managers can manage agent knowledge bases from own organization"
on public.ai_agent_knowledge_bases
for all
to authenticated
using (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
)
with check (
  organization_id = public.current_user_organization_id()
  and public.current_user_is_manager()
);

drop function if exists public.save_product_ai_configuration(
  uuid, uuid, jsonb, jsonb, uuid[]
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
  v_sales_knowledge_base_ids uuid[];
  v_support_knowledge_base_ids uuid[];
begin
  if not public.current_user_is_manager() then
    raise exception 'Sem permissão para configurar IA do produto.';
  end if;
  if p_organization_id <> public.current_user_organization_id() then
    raise exception 'Organização inválida.';
  end if;

  select name into v_product_name
  from public.products
  where id = p_product_id and organization_id = p_organization_id;

  if v_product_name is null then
    raise exception 'Produto não encontrado.';
  end if;

  v_sales_knowledge_base_ids := coalesce(
    array(select jsonb_array_elements_text(coalesce(p_sales->'knowledge_base_ids', '[]'::jsonb))::uuid),
    '{}'::uuid[]
  );
  v_support_knowledge_base_ids := coalesce(
    array(select jsonb_array_elements_text(coalesce(p_support->'knowledge_base_ids', '[]'::jsonb))::uuid),
    '{}'::uuid[]
  );

  insert into public.ai_agents (
    organization_id, product_id, internal_name, display_name, agent_type,
    status, prompt, tone, response_rules, is_managed_by_product,
    enabled_tools, tool_permissions, initial_message, fallback_message,
    common_topics, resolution_steps
  ) values (
    p_organization_id, p_product_id, 'sales-' || p_product_id::text,
    coalesce(nullif(p_sales->>'display_name', ''), v_product_name || ' Vendas'),
    'sales',
    case when coalesce((p_sales->>'enabled')::boolean, false) then 'active' else 'paused' end,
    nullif(p_sales->>'prompt', ''),
    nullif(p_sales->>'tone', ''),
    nullif(p_sales->>'rules', ''),
    true,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_sales->'enabled_tools', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_sales->'tool_permissions', '{}'::jsonb),
    nullif(p_sales->>'initial_message', ''),
    nullif(p_sales->>'fallback_message', ''),
    null,
    null
  )
  on conflict (organization_id, product_id, agent_type)
    where is_managed_by_product = true and product_id is not null
  do update set
    display_name = excluded.display_name,
    status = excluded.status,
    prompt = excluded.prompt,
    tone = excluded.tone,
    response_rules = excluded.response_rules,
    restrictions = null,
    enabled_tools = excluded.enabled_tools,
    tool_permissions = excluded.tool_permissions,
    initial_message = excluded.initial_message,
    fallback_message = excluded.fallback_message,
    common_topics = null,
    resolution_steps = null,
    updated_at = now()
  returning id into v_sales_id;

  insert into public.ai_agents (
    organization_id, product_id, internal_name, display_name, agent_type,
    status, prompt, tone, response_rules, is_managed_by_product,
    enabled_tools, tool_permissions, initial_message, fallback_message,
    common_topics, resolution_steps
  ) values (
    p_organization_id, p_product_id, 'support-' || p_product_id::text,
    coalesce(nullif(p_support->>'display_name', ''), v_product_name || ' Suporte'),
    'support',
    case when coalesce((p_support->>'enabled')::boolean, false) then 'active' else 'paused' end,
    nullif(p_support->>'prompt', ''),
    nullif(p_support->>'tone', ''),
    nullif(p_support->>'rules', ''),
    true,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_support->'enabled_tools', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_support->'tool_permissions', '{}'::jsonb),
    nullif(p_support->>'initial_message', ''),
    nullif(p_support->>'fallback_message', ''),
    null,
    null
  )
  on conflict (organization_id, product_id, agent_type)
    where is_managed_by_product = true and product_id is not null
  do update set
    display_name = excluded.display_name,
    status = excluded.status,
    prompt = excluded.prompt,
    tone = excluded.tone,
    response_rules = excluded.response_rules,
    restrictions = null,
    enabled_tools = excluded.enabled_tools,
    tool_permissions = excluded.tool_permissions,
    initial_message = excluded.initial_message,
    fallback_message = excluded.fallback_message,
    common_topics = null,
    resolution_steps = null,
    updated_at = now()
  returning id into v_support_id;

  delete from public.ai_agent_knowledge_bases
  where organization_id = p_organization_id
    and agent_id in (v_sales_id, v_support_id);

  insert into public.ai_agent_knowledge_bases (
    organization_id, agent_id, knowledge_base_id
  )
  select p_organization_id, v_sales_id, kb.id
  from public.knowledge_bases kb
  where kb.organization_id = p_organization_id
    and kb.id = any(v_sales_knowledge_base_ids)
    and kb.status <> 'archived'
  on conflict (agent_id, knowledge_base_id) do nothing;

  insert into public.ai_agent_knowledge_bases (
    organization_id, agent_id, knowledge_base_id
  )
  select p_organization_id, v_support_id, kb.id
  from public.knowledge_bases kb
  where kb.organization_id = p_organization_id
    and kb.id = any(v_support_knowledge_base_ids)
    and kb.status <> 'archived'
  on conflict (agent_id, knowledge_base_id) do nothing;

  delete from public.product_knowledge_bases
  where organization_id = p_organization_id and product_id = p_product_id;

  insert into public.product_knowledge_bases (
    organization_id, product_id, knowledge_base_id
  )
  select distinct p_organization_id, p_product_id, kb.id
  from public.knowledge_bases kb
  where kb.organization_id = p_organization_id
    and kb.id = any(coalesce(
      nullif(v_sales_knowledge_base_ids || v_support_knowledge_base_ids, '{}'::uuid[]),
      coalesce(p_knowledge_base_ids, '{}'::uuid[])
    ))
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
      'sales_knowledge_base_ids', coalesce(v_sales_knowledge_base_ids, '{}'::uuid[]),
      'support_knowledge_base_ids', coalesce(v_support_knowledge_base_ids, '{}'::uuid[])
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
