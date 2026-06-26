alter table public.ai_agent_usage
  add column if not exists provider text,
  add column if not exists model text,
  add column if not exists tool text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.ai_bad_responses
  add column if not exists message text,
  add column if not exists note text,
  add column if not exists tool text,
  add column if not exists created_by uuid;

insert into public.permissions (key, description)
values
  ('ai.harness.use', 'Usar o AI Agent Harness.'),
  ('ai.tool.sales', 'Usar ferramentas de IA para vendas.'),
  ('ai.tool.support', 'Usar ferramentas de IA para suporte.'),
  ('ai.tool.chat', 'Usar ferramentas de IA para mensagens de chat.'),
  ('ai.tool.product', 'Usar ferramentas de IA para contexto de produto.'),
  ('ai.tool.ops', 'Usar ferramentas de IA para operação interna.'),
  ('ai.bad_response.mark', 'Marcar respostas ruins geradas por IA.'),
  ('ai.auto.use', 'Usar automações de IA quando permitido.')
on conflict (key) do nothing;
