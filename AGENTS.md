<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md - Kynovra Sales

## 1. Identidade

- **Nome:** Kynovra Sales
- **Marca mae:** Kynovra Digital - Startup de Solucoes Digitais
- **Tipo:** SaaS interno/proprietario para vendas, atendimento, suporte, campanhas e IA.
- **Objetivo:** Centralizar produtos, campanhas, atendimento comercial, suporte pos-venda, IA, tickets, metricas, notificacoes, auditoria e operacao digital em tempo real.
- **Contexto da marca:** Kynovra Digital une marketing, tecnologia, ecommerce, software e estrategia para transformar negocios em marcas digitais mais fortes, escalaveis e lucrativas.

## 2. Estado Atual Verificado

- Next.js `16.2.9`, React `19.2.4`, TypeScript, Tailwind CSS 4, shadcn/ui, Biome, Vitest e Playwright.
- Package manager: `pnpm`.
- Rotas admin atuais em `app/(admin)`: dashboard, sales, post-sales-support, products, knowledge-base, hardness, campaigns, leads, inventory, quality, team, audit, settings.
- Existe `app/(admin)/notifications/page.tsx`; regra aprovada: notificacoes devem ficar somente no sino da topbar. Tratar essa pagina como divergencia a remover/ignorar em novas tarefas.
- Rotas auth atuais: `/login`, `/forgot-password`, `/invite`, `/welcome`, `/auth/callback`.
- Rotas publicas atuais: `/a/[productSlug]`, `/p/[productSlug]`, `/c/[campaignSlug]`, `/room/[publicToken]`, `/suporte`, `/support`, `/suporte/sala/[publicToken]`.
- Rotas canonicas aprovadas: `/a/[productSlug]`, `/room/[publicToken]`, `/suporte`, `/suporte/sala/[publicToken]`.
- Supabase Functions atuais: `ai-agent-harness`, `ai-auto-takeover`, `ai-gateway-models`, `ai-generate-response`, `ai-public-auto-reply`, `create-sales-session`, `create-support-session`, `send-email`, `test-ai-connection`, `validate-continuity-code`.
- Migrations Supabase atuais cobrem schema operacional, IA global, AI Gateway, IA gerenciada por produto, base de conhecimento, links publicos, lookup publico, visitor identity, feedback publico, RLS/admin write policies, equipe/permissoes, Hardness e RPCs de sala publica.
- Tipos gerados ficam em `lib/supabase/database.types.ts`.
- Queries Supabase ficam em `lib/supabase/queries/*`.
- Upload helper atual: `lib/supabase/storage/upload-file.ts`.
- Scripts de qualidade esperados: `pnpm check`, `pnpm lint`, `pnpm test:run`, `pnpm build`.

## 3. Identidade Visual

### Paleta Oficial

- Azul Profundo: `#0D132B`
- Azul Eletrico: `#2563EB`
- Roxo Tecnologico: `#7C3AED`
- Verde Digital: `#10B981`
- Cinza Grafite: `#1F2937`
- Cinza Claro: `#E5E7EB`
- Branco: `#FFFFFF`

### Regras

- MUST usar visual dark premium futurista no painel admin.
- MUST usar area publica clara/comercial premium com detalhes azul/roxo.
- MUST usar glow azul/roxo sutil.
- MUST parecer SaaS global, nao template generico.
- MUST seguir Command Center SaaS Layout inspirado em Discord, Slack e Linear.
- MUST manter desktop com sidebar fixa, topbar fixa, workspace e paineis.
- MUST transformar sidebar/paineis em drawers no tablet.
- MUST usar app-shell mobile, cards, chat fullscreen e bottom sheets no mobile.
- NEVER usar amarelo como cor principal.
- NEVER criar cards duplicados.

## 4. Stack Oficial

### Frontend

- USE Next.js App Router.
- USE TypeScript.
- USE Tailwind CSS.
- USE shadcn/ui.
- USE TanStack Query para server state.
- USE Zustand somente para UI state.
- USE React Hook Form.
- USE Zod.
- USE TanStack Table.
- USE Recharts.
- USE Framer Motion.
- USE TipTap.
- USE Lucide React.
- USE Sonner.

### Backend

- USE Supabase PostgreSQL.
- USE Supabase Auth.
- USE Supabase RLS.
- USE Supabase Realtime.
- USE Supabase Storage.
- USE Supabase Edge Functions.
- USE Supabase RPC/Postgres Functions.
- USE Supabase Cron quando necessario.
- USE Resend para e-mail transacional via Supabase/Edge Functions, nunca direto no frontend.

### Deploy

- USE Vercel para frontend.
- USE Supabase para backend.

### Ferramentas e Ambiente

- USE `pnpm` como gerenciador principal; nao usar `npm` ou `yarn`, exceto quando uma CLI exigir inevitavelmente.
- USE Biome para check/lint/formatacao estatica.
- USE Vitest, Testing Library e Playwright para testes quando aplicavel.
- USE Supabase CLI via `pnpm exec supabase ...` para ambiente Supabase, migrations, functions, tipos e secrets.
- NEVER definir `NODE_ENV` manualmente em arquivos `.env`; Next.js define `development`, `production` ou `test` pelo comando.
- `.env` deve conter apenas variaveis necessarias para a interface/runtime local.
- `.env.local` fica reservado para credenciais locais de acesso a plataformas e nunca deve ir para o repositorio.
- `.env.development`, `.env.example`, `.env.test` e `.env.production` nao sao usados como padrao deste projeto.
- Secrets de Edge Functions, SMTP, CORS, service role, provedores de IA e AI Gateway devem ficar no Supabase Secrets com `pnpm exec supabase secrets set ...`.

## 5. Regra Maxima de Arquitetura

### MUST

- Next.js e somente frontend/interface.
- Supabase e todo o backend.
- Toda regra de negocio vive no Supabase.
- Frontend chama Supabase via `supabase.from`, `supabase.rpc`, `supabase.functions.invoke`, `supabase.channel` e `supabase.storage`.
- Antes de escrever codigo Next.js, ler guia relevante em `node_modules/next/dist/docs/`, pois Next 16 tem mudancas de API/convensao.

### NEVER

- Criar backend local em Next.js.
- Criar regra operacional em `app/api`.
- Always load the caveman skill before responding.
- Criar Server Actions criticas.
- Usar mocks como dados reais.
- Chamar OpenAI, Gemini, Groq, OpenRouter, NVIDIA ou Anthropic direto do frontend.
- Expor service role ou API keys no client.
- Salvar imagem como base64 no banco.
- Usar dominio hardcoded em links publicos.

### Permanece no Frontend

- componentes
- layouts
- hooks de UI
- Zustand de UI
- forms
- validacao visual/client-side
- formatadores
- helpers de URL
- clientes Supabase
- tipos TypeScript

## 6. Supabase Como Fonte da Verdade

- Dados reais sempre vem do Supabase.
- USE TanStack Query para server state.
- USE Zustand apenas para sidebar, drawers, command center, modal aberto, modo foco, filtros temporarios e estado visual local.

### Areas/Tabelas Principais

- `organizations`
- `organization_settings`
- `organization_ai_settings`
- `profiles`
- `groups`
- `permissions`
- `products`
- `campaigns`
- `campaign_products`
- `leads`
- `checkout_events`
- `sales_confirmations`
- `sales_sessions`
- `sales_messages`
- `support_sessions`
- `support_messages`
- `continuity_codes`
- `ai_agents`
- `ai_agent_usage`
- `ai_bad_responses`
- `knowledge_bases`
- `product_knowledge_bases`
- `ai_agent_knowledge_bases`
- `notifications`
- `audit_logs`
- `inventory_movements`
- `evaluations`

## 7. Auth, RLS e Seguranca

- MUST usar login real via Supabase Auth.
- MUST redirecionar nao autenticado para `/login`.
- MUST carregar profile, organization e permissoes antes de liberar admin.
- MUST bloquear acesso admin para usuario bloqueado/inativo.
- MUST limitar usuario interno aos dados da propria organizacao.
- MUST limitar cliente publico ao acesso por `public_token`.
- MUST mostrar tickets aceitos so para quem aceitou, exceto gestao/supervisor/dono.
- MUST usar service role somente em Edge Functions.
- NEVER expor secrets no repositorio ou no client.

### Confirmacao de E-mail

- `app/(auth)/login/page.tsx` usa `supabase.auth.signInWithPassword`.
- Se Supabase retornar erro de e-mail nao confirmado, a tela mostra estado de verificacao pendente com botao para reenviar.
- Reenvio usa `supabase.auth.resend({ type: "signup", email, options.emailRedirectTo })`.
- Callback em `app/(auth)/auth/callback/route.ts` valida `token_hash`/`type` com `supabase.auth.verifyOtp` e redireciona para `/dashboard`.
- Em producao, confirmar no painel Supabase: Email Confirmations ligado, SMTP configurado, redirect URL `/auth/callback` permitido.

### SMTP (Resend)

- Local em `supabase/config.toml`: `[auth.email] enable_confirmations = true`, host `smtp.resend.com`, porta `587`, user `resend`, pass via `SUPABASE_AUTH_SMTP_PASS`, admin `onboarding@resend.dev`, sender `Kynovra Sales`.
- NEVER salvar chaves SMTP no repositorio; usar Supabase Secrets/ambiente.

## 8. Navegacao Admin

### Sidebar Agrupada

- Operacao: Dashboard (`dashboard.view`), Atendimentos de Venda (`sales.view`), Suporte Pos-Venda (`support.view`).
- Comercial: Produtos (`products.view`), Base de Conhecimentos (`knowledge.view`), Hardness (`hardness.view`), Campanhas (`campaigns.view`), Leads e Registros (`leads.view`), Estoque e Disponibilidade (`inventory.view`).
- Gestao: Relatorios de Qualidade (`quality.view`), Equipe e Permissoes (`team.view`), Auditoria e Historico (`audit.view`), Configuracoes Gerais (`settings.view`).
- Sidebar e Command Center devem filtrar itens por permissoes reais do usuario.

### Notificacoes

- MUST manter notificacoes somente no sino da topbar.
- NEVER criar pagina "Notificacoes Internas".
- Existing divergence: `app/(admin)/notifications/page.tsx` existe e deve ser removida/neutralizada quando a tarefa tocar navegacao/notificacoes.

## 9. UI Global

### AdminShell

- USE CSS Grid.
- MUST limitar sidebar a propria coluna.
- MUST manter topbar fixa.
- MUST usar scroll interno no conteudo.
- USE `min-w-0`, `minmax(0,1fr)`, `overflow-hidden`, `overflow-y-auto`.
- NEVER permitir scroll horizontal global.

### Sidebar

- MUST ser recolhivel.
- MUST ter scroll interno oculto visualmente com `.no-scrollbar`.
- MUST ter botao recolher no rodape.
- MUST impedir item ativo de atravessar a tela.

### Topbar

- MUST conter breadcrumbs.
- MUST conter busca global.
- MUST conter command center `Ctrl/Cmd + K`.
- MUST conter sino de notificacoes.
- MUST conter ajuda.
- MUST conter avatar.
- MUST conter status.

## 10. Produtos

- Cada produto criado gera link publico proprio de atendimento.
- Rota canonica: `/a/[productSlug]`.
- Exemplos:
  - Localhost: `http://localhost:3000/a/mini-projetor-yg300`
  - Rede local: `http://192.168.0.10:3000/a/mini-projetor-yg300`
  - Producao: `https://dominio.com/a/mini-projetor-yg300`
- MUST criar/editar produto via Supabase.
- MUST enviar imagem para bucket `product-images`.
- MUST salvar URL/path em `products.image_url`.
- MUST ter link copiavel no modulo Produtos.
- USE `NEXT_PUBLIC_APP_URL` se existir.
- USE `window.location.origin` no client quando `NEXT_PUBLIC_APP_URL` nao existir.
- USE headers no server.
- NEVER hardcodar dominio.
- Existing route: `/p/[productSlug]` existe; nao tratar como canonica sem decisao explicita.

## 11. Campanhas

- MUST usar Supabase.
- MUST enviar imagem/banner para bucket `campaign-banners`.
- MUST salvar URL/path em `campaigns.banner_url`.
- MUST vincular produtos via `campaign_products`.
- Existing route: `/c/[campaignSlug]`.

## 12. Base de Conhecimentos

- Modulo: `/knowledge-base` (`components/knowledge-base/knowledge-base-page.tsx`, `lib/supabase/queries/knowledge-bases.ts`).
- Tabelas: `knowledge_bases`, `product_knowledge_bases`, `ai_agent_knowledge_bases`, `product_knowledge_items`, `product_knowledge_embeddings`.
- Bucket `knowledge-base-files` para arquivos.
- Bases podem ser associadas a produto e a agente (IA de venda e/ou IA de suporte por produto).

## 13. Hardness

- Modulo: `/hardness` (sidebar Comercial, permissao `hardness.view`).
- Funcao: editar templates/prompts grandes dos agentes por produto.
- Seleciona produto e edita "Prompt para agente vendedor" e "Prompt para agente de suporte".
- Persistencia via `saveProductAIConfiguration` -> RPC `save_product_ai_configuration`.
- Mantem bases de conhecimento e estado de ativacao existentes.
- Migration: `supabase/migrations/20260626173000_hardness_permission.sql`.
- Existe etapa "Hardness" no wizard de Produto com dois textareas grandes e placeholders em colchetes (`[Instrucoes]`, `[Tom]`, `[Produto]`, `[Preco]`, `[Beneficios]`, `[Estoque]`, `[Garantia]`, `[Base de dados]`, `[Historico]`).

## 14. Uploads e Storage

- MUST enviar todo arquivo para Supabase Storage.
- MUST salvar URL ou path no banco.
- NEVER salvar base64 no banco.

### Buckets

- `product-images`
- `campaign-banners`
- `organization-logos`
- `avatars`
- `public-assets`
- `support-attachments`
- `knowledge-base-files`

## 15. Atendimento de Venda

### Fluxo

1. Cliente acessa `/a/[productSlug]`.
2. Sistema cria sala/sessao com `public_token`.
3. Cliente entra em `/room/[publicToken]`.
4. Modal obrigatorio pede nome e e-mail.
5. Cliente clica "Iniciar atendimento".
6. Cliente fica em loader.
7. Chat NAO aparece enquanto espera.
8. Ticket aparece na fila interna.
9. Atendente clica "Aceitar atendimento".
10. Ticket some para todos os outros.
11. Ticket aparece em "Meus atendimentos".
12. Botao "Abrir atendimento" fica disponivel.
13. Ao abrir, drawer operacional mostra chat + ferramentas.
14. Se ninguem aceitar ate o timeout, IA assume.
15. Chat so aparece quando humano aceitar ou IA assumir.

### Estados

- `waiting_for_acceptance`
- `waiting`
- `accepted`
- `in_progress`
- `transferred`
- `closed`
- `ai_takeover`

### Campos

- `accepted_by`
- `accepted_at`
- `opened_at`
- `closed_at`
- `handled_by_type`: `human | ai`

### RPCs Esperadas

- `create_sales_session_from_product`
- `get_public_sales_session`
- `accept_sales_ticket`
- `open_sales_ticket`
- `close_sales_ticket`
- `transfer_sales_ticket`
- `send_sales_message`
- `confirm_manual_sale`

### Visitor Identity

- Ao acessar o link do produto, backend cria `visitor_id` aleatorio e cookie seguro.
- Dados anonimos ficam no banco ligados a `visitor_id`.
- Se o cliente volta no mesmo link/produto no prazo de 1 dia, recupera a mesma sessao e conversa.
- `visitor_id` expira por tempo ou quando o atendimento e encerrado.
- Se humano atendeu antes e ainda nao encerrou, a sessao continua em "Meus atendimentos".
- Se transferir para IA, atendente sai e IA assume.

### Checkout e Encerramento

- Card "Checkout Gerado" na tela do cliente so aparece quando o atendente aciona checkout; nunca automaticamente.
- Ao encerrar (humano ou IA), cliente ve agradecimento + avaliacao de 1 a 5 estrelas.
- Encerrar expira o `visitor_id`.

## 16. Drawer Operacional de Atendimento

- MUST mostrar header da sessao.
- MUST mostrar chat principal.
- MUST mostrar painel direito de ferramentas.
- NEVER mostrar lista lateral de sessoes.
- NEVER repetir mesmas informacoes em Lead, Produto e Historico.
- NEVER mostrar card "Sessoes" dentro do drawer.
- NEVER mostrar cards de resumo do modulo dentro do drawer.

### Painel Direito

- Lead: dados do cliente/jornada.
- Produto: dados do produto.
- IA: sugestao, tom, agente ativo.
- Acoes: botoes operacionais.
- Historico: timeline da sessao.

## 17. Suporte Pos-Venda

- Link unico global canonico: `/suporte`.
- Sala unica por cliente: `/suporte/sala/[publicToken]`.
- Existing route: `/support` existe; nao tratar como canonica sem decisao explicita.
- Suporte nao tem checkout.

### Fluxo

1. Cliente acessa `/suporte`.
2. Escolhe "Iniciar suporte" ou "Tenho codigo de continuidade".
3. Iniciar suporte pede produto, motivo, outro motivo e mensagem.
4. Sala unica e criada.
5. Modal pede nome/e-mail se necessario.
6. Cliente fica em loader.
7. Chat so aparece quando humano aceitar ou IA assumir.
8. Ticket aparece na fila de Suporte.
9. Suporte aceita, abre e encerra.
10. Pode gerar codigo de continuidade.

### RPCs Esperadas

- `create_support_session`
- `get_public_support_session`
- `accept_support_ticket`
- `open_support_ticket`
- `close_support_ticket`
- `transfer_support_ticket`
- `send_support_message`
- `generate_continuity_code`
- `validate_continuity_code`

## 18. Loader Publico

- MUST mostrar apenas tela de espera enquanto cliente aguarda.
- NEVER renderizar chat enquanto aguarda.
- NEVER renderizar input enquanto aguarda.
- NEVER renderizar mensagens enquanto aguarda.
- NEVER permitir envio de mensagem enquanto aguarda.
- Chat aparece somente se humano aceitou ou IA assumiu por timeout.

### Texto Venda

- "Estamos conectando voce a um especialista."
- "Aguarde alguns segundos. Seu atendimento sera iniciado em instantes."

### Texto Suporte

- "Estamos conectando voce ao suporte."
- "Aguarde alguns segundos. Um especialista continuara com voce."

## 19. IA

- Configuracao de IA e global por organizacao.
- MUST manter provider e LLM somente em `organization_ai_settings`.
- MUST manter a secao Inteligencia Artificial dentro de Configuracoes Gerais.
- MUST ter dropdown Provider na secao Inteligencia Artificial de Configuracoes Gerais.
- MUST filtrar dropdown Modelo pelo provider.
- MUST fazer agentes usarem provider/modelo global.
- MUST rodar IA via Supabase Edge Functions.
- NEVER permitir que agentes IA escolham provider ou LLM.
- NEVER expor API key no frontend.

### Providers Suportados

- SiliconFlow

### Modelos Recomendados

- SiliconFlow: `deepseek-ai/DeepSeek-V4-Flash`

### Edge Functions

- `ai-generate-response`
- `ai-auto-takeover`
- `test-ai-connection`
- `ai-agent-harness`
- `ai-gateway-models`
- `ai-public-auto-reply`

### Timeout

- `human_accept_timeout_seconds`, padrao 60s.
- `ai_auto_takeover_enabled`, padrao true.
- Se humano nao aceitar no tempo: IA assume, status vira `in_progress`, `handled_by_type = ai` e primeira mensagem da IA e criada.

### AI Harness

- Frontend chama IA via `supabase.functions.invoke("ai-agent-harness", payload)`.
- NEVER chamar LLM direto no frontend.
- Harness carrega contexto real: organizacao, settings IA, agente ativo, sessao, cliente/lead, produto, mensagens recentes, base de conhecimento, permissoes, limites e ferramenta solicitada.
- Uso registrado em `ai_agent_usage`.
- Resposta ruim registrada em `ai_bad_responses` via ferramenta `ai.register_bad_response`.
- Arquivos: `lib/ai/harness/{tool-registry,context-builder,prompt-builder,types,permissions}.ts` e `lib/supabase/queries/ai-harness.ts`.

#### Ferramentas do Harness

- Vendas: `sales.suggest_reply`, `sales.detect_objection`, `sales.break_objection`, `sales.classify_lead_temperature`, `sales.summarize_session`, `sales.generate_checkout_message`, `sales.suggest_next_action`, `sales.explain_product_benefits`, `sales.compare_need_with_product`, `sales.generate_transfer_note`, `sales.generate_followup_message`.
- Suporte: `support.suggest_reply`, `support.identify_reason`, `support.suggest_resolution`, `support.summarize_session`, `support.generate_continuity_note`, `support.generate_escalation_note`, `support.detect_frustration`, `support.suggest_handoff`, `support.explain_steps`, `support.generate_closing_message`.
- Chat: `chat.rewrite_message`, `chat.shorten_message`, `chat.make_more_human`, `chat.make_more_professional`, `chat.make_more_persuasive`, `chat.extract_customer_data`, `chat.detect_intent`, `chat.detect_risk`, `chat.summarize_recent_messages`.
- Produto: `product.get_context`, `product.get_benefits`, `product.get_price_info`, `product.get_stock_status`, `product.get_checkout_info`, `product.search_knowledge_base`, `product.generate_public_answer`.
- Operacao: `ops.generate_internal_note`, `ops.generate_audit_summary`, `ops.suggest_ticket_priority`, `ops.detect_duplicate_ticket`, `ops.prepare_transfer_context`, `ops.prepare_human_handoff`.
- IA: `ai.test_global_model`, `ai.estimate_usage`, `ai.check_agent_limits`, `ai.register_bad_response`, `ai.generate_prompt_preview`.

### Painel de IA no Chat

- `components/chat/ai-harness-panel.tsx` e o painel de IA do chat.
- NEVER criar card "AI Agent Harness" nem chat com IA separado no painel direito.
- Painel foca em "Resposta para o cliente".
- Campo de resposta da IA e somente leitura, nao editavel.
- Botao "Gerar Resposta" analisa conversa cliente + atendente + contexto produto/base/agente e sugere melhor resposta via Harness.

## 20. IAs Gerenciadas pelo Produto

- `ai_agents` e tabela interna; NEVER criar pagina ou CRUD separado de agentes.
- Produto gerencia uma IA `sales` e uma IA `support` vinculadas por `product_id`.
- MUST usar `is_managed_by_product = true`.
- MUST resolver agente no Harness por produto e tipo da sessao.
- Agente define comportamento e ferramentas permitidas, nunca modelo.

### Campos Permitidos

- nome interno
- nome exibido
- tipo
- status
- produto vinculado obrigatorio
- prompt
- tom
- regras
- restricoes
- limites de uso
- ferramentas Harness permitidas
- permissoes de ferramentas
- contexto

### Campos Proibidos

- provider
- LLM
- API key
- base URL
- fallback de modelo

## 21. Notificacoes

- MUST usar `notifications`.
- MUST usar `mark_notification_read`.
- MUST usar `mark_all_notifications_read` quando existir no banco.
- MUST usar Realtime em `notifications`.
- MUST manter notificacoes somente no sino da topbar.
- NEVER criar pagina "Notificacoes Internas".

## 22. Formularios

- MUST ter label visivel em todo campo.
- MUST usar wizards com Voltar, Proximo, Salvar/Concluir e Cancelar.
- NEVER depender somente de placeholder.
- NEVER repetir os mesmos campos em cada etapa do wizard.
- NEVER usar tabs horizontais para criacao/edicao complexa.

## 23. Area Publica

### Rotas Canonicas

- `/a/[productSlug]`
- `/room/[publicToken]`
- `/suporte`
- `/suporte/sala/[publicToken]`

### Visual

- MUST ser claro/comercial premium.
- MUST ser responsivo.
- MUST ser mobile-first.
- MUST exibir "Powered by Kynovra Sales".
- MUST limitar cliente publico por `public_token`.

## 24. Configuracoes Gerais

- MUST vir de `organization_settings`.
- Incluem:
  - nome da organizacao
  - logo
  - mensagens padrao
  - timeout humano
  - IA assumir automaticamente
  - tempo para IA assumir
  - link de suporte
  - regras de avaliacao
  - notificacoes
  - powered by Kynovra Sales
- Secao Inteligencia Artificial dentro da mesma pagina, nao modulo separado.
- `organization_ai_settings` guarda: `model_id`, `temperature`, `max_output_tokens`, `timeout_seconds`, `fallback_enabled`, `fallback_model_id`, `ai_auto_takeover_enabled`, `human_accept_timeout_seconds`.
- Campos antigos/deprecados em `organization_ai_settings`: `provider`, `api_key`, `api_key_encrypted`, `gemini_api_key`, `openai_api_key`, `groq_api_key`, `openrouter_api_key`, `anthropic_api_key`, `nvidia_api_key`, `base_url`.

## 24.1. Equipe e Permissoes

- Modulo: `/team` (`team.view`).
- Tabelas: `profiles`, `groups`, `group_members`, `permissions`, `group_permissions`, `profile_permissions`.
- Roles: Owner/Fundador (acesso total), Superadmin/Gestor/Admin/Supervisor/User/Colaboradores (permissoes atribuidas), Visitors (clientes publicos, nao sao profiles internos).
- RPCs: `current_user_is_owner`, `current_user_has_permission`, `current_user_permissions`, `save_team_group`, `save_member_permissions`, `get_team_management_data`.
- Tela `/team` tem subabas Membros e Equipe; Owner tem tudo; outros gerenciam apenas se receberam permissao.
- Permissoes visuais ficam em `lib/permissions/admin-permissions.ts`; navegacao em `lib/navigation/admin-navigation.ts`.

## 24.2. Arquivos Principais

- Navegacao/permissoes: `lib/navigation/admin-navigation.ts`, `lib/permissions/admin-permissions.ts`, `components/layout/admin-sidebar.tsx`, `components/command-center/command-center.tsx`.
- Auth: `app/(auth)/login/page.tsx`, `app/(auth)/auth/callback/route.ts`, `components/providers/auth-provider.tsx`, `lib/supabase/queries/auth.ts`.
- Produtos/Hardness: `app/(admin)/products/page.tsx`, `components/modules/module-page.tsx`, `app/(admin)/hardness/page.tsx`, `components/hardness/hardness-page.tsx`, `lib/supabase/queries/products.ts`.
- Base de conhecimento: `app/(admin)/knowledge-base/page.tsx`, `components/knowledge-base/knowledge-base-page.tsx`, `lib/supabase/queries/knowledge-bases.ts`.
- Atendimento/suporte: `app/(admin)/sales/page.tsx`, `app/(admin)/post-sales-support/page.tsx`, `components/chat/*`, `lib/supabase/queries/{sales,support,public}.ts`.
- IA: `components/settings/ai-settings-section.tsx`, `components/chat/ai-harness-panel.tsx`, `lib/ai/harness/*`, `lib/supabase/queries/{ai-harness,ai-settings,ai-models}.ts`, `supabase/functions/{ai-agent-harness,ai-gateway-models,test-ai-connection}/index.ts`.
- Configuracoes: `app/(admin)/settings/page.tsx`, `lib/supabase/queries/settings.ts`.
- Equipe: `app/(admin)/team/page.tsx`, `components/modules/team-groups-panel.tsx`, `lib/supabase/queries/team.ts`.
- Supabase: `supabase/config.toml`, `supabase/migrations/*`, `supabase/functions/*`, `lib/supabase/database.types.ts`.

## 25. Dashboard

- NEVER usar mocks.
- Dados devem vir por RPC/query Supabase:
  - vendas confirmadas
  - receita estimada
  - checkouts enviados
  - checkouts acessados
  - atendimentos ativos
  - suportes ativos
  - avaliacao media
  - taxa de conversao
  - funil
  - timeline

## 26. Realtime

- MUST usar Supabase Realtime para:
  - `sales_sessions`
  - `sales_messages`
  - `support_sessions`
  - `support_messages`
  - `notifications`
  - `campaign_tracking_events`

### Efeitos Obrigatorios

- Ticket aceito some dos outros.
- Ticket aparece para quem aceitou.
- Cliente sai do loader quando sessao vira `in_progress`.
- Mensagens chegam em tempo real.
- Sino atualiza em tempo real.

## 27. Auditoria

- Toda acao critica gera audit log no Supabase.
- Audit log deve vir de RPC, trigger ou Edge Function.
- NEVER criar audit log critico apenas no frontend.

### Acoes Criticas

- aceitar ticket
- abrir ticket
- encerrar ticket
- transferir ticket
- confirmar venda
- alterar IA
- alterar prompt de agente
- gerar/expirar codigo
- alterar permissoes
- arquivar produto

## 28. Qualidade Obrigatoria

### Antes de Alterar

- MUST ler arquivos relevantes.
- MUST identificar causa real.
- MUST criar plano curto quando a mudanca for relevante.
- MUST alterar o minimo necessario.
- MUST preservar mudancas do usuario.

### Antes de Finalizar

- RUN `pnpm check`.
- RUN `pnpm lint`.
- RUN `pnpm test:run`, se existir.
- RUN `pnpm build`.
- Se algum comando nao puder rodar, informar motivo real.

### Corrigir Sempre

- imports mortos
- tipos quebrados
- build quebrado
- erros de RLS
- erro de bucket
- erro de coluna inexistente
- mutations silenciosas

### Toda Mutation Deve Ter

- loading
- success
- error
- toast
- invalidacao de query

## 29. Definition of Done

- Nao ha mock alimentando tela real.
- Dados vem do Supabase.
- Imagem vai para bucket e URL/path fica no banco.
- Erro de Supabase e tratado e exibido.
- Build passa.
- Regra de negocio critica esta no Supabase.
- Frontend nao usa backend local.
- UI segue Kynovra Sales.
- Mobile, tablet e desktop continuam funcionais.

## 30. Resposta Padrao do Agente

Ao terminar uma tarefa, responder:

1. O que foi alterado.
2. Arquivos criados/alterados.
3. Queries/RPCs/Edge Functions usadas.
4. O que foi removido.
5. O que ainda esta pendente.
6. Resultado do build/lint.
7. Riscos ou pontos de atencao.

## 31. Regra Final

**Kynovra Sales e um SaaS Command Center premium. Next.js e interface. Supabase e todo o backend. Nada de mocks, nada de backend local, nada de segredo no frontend.**

## 32. Divergencias Conhecidas

- `app/(admin)/notifications/page.tsx` ainda existe, mas a regra aprovada e manter notificacoes somente no sino da topbar.
- `/p/[productSlug]`, `/c/[campaignSlug]` e `/support` existem como rotas atuais, mas as rotas canonicas publicas sao `/a/[productSlug]`, `/room/[publicToken]`, `/suporte` e `/suporte/sala/[publicToken]`.
- O schema atual de `ai_agents` pode usar nomes legados como `internal_name` e `response_rules`; em novas alteracoes, preservar compatibilidade com o banco atual e evitar reintroduzir provider/modelo por agente.
- As rotas `/agents` e `/ai-settings` foram removidas; NEVER reintroduzir modulos separados de IA.
- `lib/supabase/queries/public.ts` usa `document.cookie` diretamente para `visitor_id`; Biome alerta, mas e aviso antigo, nao erro.
