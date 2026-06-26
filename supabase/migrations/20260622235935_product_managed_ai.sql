alter table public.products
  add column if not exists stock_quantity integer not null default 0,
  add column if not exists stock_minimum integer not null default 0,
  add column if not exists public_description text;

alter table public.ai_agents
  add column if not exists is_managed_by_product boolean not null default false,
  add column if not exists enabled_tools text[] not null default '{}'::text[],
  add column if not exists tool_permissions jsonb not null default '{}'::jsonb,
  add column if not exists common_topics text,
  add column if not exists resolution_steps text,
  add column if not exists initial_message text,
  add column if not exists fallback_message text;

create unique index if not exists ai_agents_managed_product_type_idx
  on public.ai_agents (organization_id, product_id, agent_type)
  where is_managed_by_product = true and product_id is not null;

create or replace function public.save_product_ai_configuration(
  p_organization_id uuid,
  p_product_id uuid,
  p_sales jsonb,
  p_support jsonb,
  p_knowledge text default null
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

  select name into v_product_name
  from public.products
  where id = p_product_id and organization_id = p_organization_id;

  if v_product_name is null then
    raise exception 'Produto não encontrado.';
  end if;

  insert into public.ai_agents (
    organization_id, product_id, internal_name, display_name, agent_type,
    status, prompt, tone, response_rules, restrictions, is_managed_by_product,
    enabled_tools, tool_permissions, common_topics, resolution_steps,
    initial_message, fallback_message
  ) values (
    p_organization_id, p_product_id, 'sales-' || p_product_id::text,
    coalesce(nullif(p_sales->>'display_name', ''), v_product_name || ' Vendas'),
    'sales', case when coalesce((p_sales->>'enabled')::boolean, false) then 'active' else 'paused' end,
    nullif(p_sales->>'prompt', ''), nullif(p_sales->>'tone', ''),
    nullif(p_sales->>'rules', ''), nullif(p_sales->>'objections', ''), true,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_sales->'enabled_tools', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_sales->'tool_permissions', '{}'::jsonb),
    nullif(p_sales->>'objections', ''), null, nullif(p_sales->>'initial_message', ''),
    nullif(p_sales->>'fallback_message', '')
  )
  on conflict (organization_id, product_id, agent_type)
    where is_managed_by_product = true and product_id is not null
  do update set
    display_name = excluded.display_name, status = excluded.status,
    prompt = excluded.prompt, tone = excluded.tone,
    response_rules = excluded.response_rules, restrictions = excluded.restrictions,
    enabled_tools = excluded.enabled_tools, tool_permissions = excluded.tool_permissions,
    common_topics = excluded.common_topics, resolution_steps = null,
    initial_message = excluded.initial_message, fallback_message = excluded.fallback_message,
    updated_at = now()
  returning id into v_sales_id;

  insert into public.ai_agents (
    organization_id, product_id, internal_name, display_name, agent_type,
    status, prompt, tone, response_rules, restrictions, is_managed_by_product,
    enabled_tools, tool_permissions, common_topics, resolution_steps,
    initial_message, fallback_message
  ) values (
    p_organization_id, p_product_id, 'support-' || p_product_id::text,
    coalesce(nullif(p_support->>'display_name', ''), v_product_name || ' Suporte'),
    'support', case when coalesce((p_support->>'enabled')::boolean, false) then 'active' else 'paused' end,
    nullif(p_support->>'prompt', ''), nullif(p_support->>'tone', ''),
    nullif(p_support->>'rules', ''), nullif(p_support->>'common_reasons', ''), true,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_support->'enabled_tools', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_support->'tool_permissions', '{}'::jsonb),
    nullif(p_support->>'common_reasons', ''), nullif(p_support->>'resolution_steps', ''),
    nullif(p_support->>'initial_message', ''), nullif(p_support->>'fallback_message', '')
  )
  on conflict (organization_id, product_id, agent_type)
    where is_managed_by_product = true and product_id is not null
  do update set
    display_name = excluded.display_name, status = excluded.status,
    prompt = excluded.prompt, tone = excluded.tone,
    response_rules = excluded.response_rules, restrictions = excluded.restrictions,
    enabled_tools = excluded.enabled_tools, tool_permissions = excluded.tool_permissions,
    common_topics = excluded.common_topics, resolution_steps = excluded.resolution_steps,
    initial_message = excluded.initial_message, fallback_message = excluded.fallback_message,
    updated_at = now()
  returning id into v_support_id;

  delete from public.product_knowledge_items
  where organization_id = p_organization_id
    and product_id = p_product_id
    and metadata->>'source' = 'product_wizard';

  if nullif(trim(coalesce(p_knowledge, '')), '') is not null then
    insert into public.product_knowledge_items (
      organization_id, product_id, title, content, metadata
    ) values (
      p_organization_id, p_product_id, 'Base principal', trim(p_knowledge),
      jsonb_build_object('source', 'product_wizard')
    );
  end if;

  insert into public.audit_logs (
    organization_id, actor_id, action, entity_type, entity_id, metadata
  ) values (
    p_organization_id, auth.uid(), 'product.ai_configuration_saved',
    'products', p_product_id,
    jsonb_build_object('sales_agent_id', v_sales_id, 'support_agent_id', v_support_id)
  );

  return jsonb_build_object(
    'success', true,
    'sales_agent_id', v_sales_id,
    'support_agent_id', v_support_id
  );
end;
$$;

grant execute on function public.save_product_ai_configuration(uuid, uuid, jsonb, jsonb, text)
  to authenticated;
