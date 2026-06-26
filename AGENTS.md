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
- Rotas admin atuais em `app/(admin)`: dashboard, sales, post-sales-support, products, campaigns, leads, inventory, quality, team, audit, settings.
- Existe `app/(admin)/notifications/page.tsx`; regra aprovada: notificacoes devem ficar somente no sino da topbar. Tratar essa pagina como divergencia a remover/ignorar em novas tarefas.
- Rotas publicas atuais: `/a/[productSlug]`, `/p/[productSlug]`, `/c/[campaignSlug]`, `/room/[publicToken]`, `/suporte`, `/support`, `/suporte/sala/[publicToken]`.
- Rotas canonicas aprovadas: `/a/[productSlug]`, `/room/[publicToken]`, `/suporte`, `/suporte/sala/[publicToken]`.
- Supabase Functions atuais: `ai-generate-response`, `ai-auto-takeover`, `test-ai-connection`, `create-sales-session`, `create-support-session`, `validate-continuity-code`, `send-email`.
- Migrations Supabase atuais cobrem schema operacional, IA global, links publicos, lookup publico, RLS/admin write policies e RPCs de sala publica.
- Tipos gerados ficam em `lib/supabase/database.types.ts`.
- Queries Supabase ficam em `lib/supabase/queries/*`.
- Upload helper atual: `lib/supabase/storage/upload-file.ts`.

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

### Deploy

- USE Vercel para frontend.
- USE Supabase para backend.

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
- `sales_sessions`
- `sales_messages`
- `support_sessions`
- `support_messages`
- `continuity_codes`
- `ai_agents`
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

## 8. Navegacao Admin

### Sidebar Agrupada

- Operacao: Dashboard, Atendimentos de Venda, Suporte Pos-Venda.
- Comercial: Produtos, Campanhas, Leads e Registros, Estoque e Disponibilidade.
- Gestao: Relatorios de Qualidade, Equipe e Permissoes, Auditoria e Historico, Configuracoes Gerais.

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

## 12. Uploads e Storage

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

## 13. Atendimento de Venda

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

## 14. Drawer Operacional de Atendimento

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

## 15. Suporte Pos-Venda

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

## 16. Loader Publico

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

## 17. IA

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

- OpenAI
- Google Gemini
- Groq
- OpenRouter
- NVIDIA
- Anthropic Claude

### Modelos Recomendados

- OpenAI: GPT-4.1 Mini, GPT-4.1
- Google: Gemini 2.5 Flash, Flash-Lite, Pro
- Groq: Llama 3.3 70B, Llama 3.1 8B Instant, Qwen
- OpenRouter: Free Router e modelos pagos
- NVIDIA: modelos disponiveis no catalogo
- Anthropic: Claude Haiku, Sonnet, Opus

### Edge Functions

- `ai-generate-response`
- `ai-auto-takeover`
- `test-ai-connection`

### Timeout

- `human_accept_timeout_seconds`, padrao 60s.
- `ai_auto_takeover_enabled`, padrao true.
- Se humano nao aceitar no tempo: IA assume, status vira `in_progress`, `handled_by_type = ai` e primeira mensagem da IA e criada.

## 18. IAs Gerenciadas pelo Produto

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

## 19. Notificacoes

- MUST usar `notifications`.
- MUST usar `mark_notification_read`.
- MUST usar `mark_all_notifications_read` quando existir no banco.
- MUST usar Realtime em `notifications`.
- MUST manter notificacoes somente no sino da topbar.
- NEVER criar pagina "Notificacoes Internas".

## 20. Formularios

- MUST ter label visivel em todo campo.
- MUST usar wizards com Voltar, Proximo, Salvar/Concluir e Cancelar.
- NEVER depender somente de placeholder.
- NEVER repetir os mesmos campos em cada etapa do wizard.
- NEVER usar tabs horizontais para criacao/edicao complexa.

## 21. Area Publica

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

## 22. Configuracoes Gerais

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

## 23. Dashboard

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

## 24. Realtime

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

## 25. Auditoria

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

## 26. Qualidade Obrigatoria

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

## 27. Definition of Done

- Nao ha mock alimentando tela real.
- Dados vem do Supabase.
- Imagem vai para bucket e URL/path fica no banco.
- Erro de Supabase e tratado e exibido.
- Build passa.
- Regra de negocio critica esta no Supabase.
- Frontend nao usa backend local.
- UI segue Kynovra Sales.
- Mobile, tablet e desktop continuam funcionais.

## 28. Resposta Padrao do Agente

Ao terminar uma tarefa, responder:

1. O que foi alterado.
2. Arquivos criados/alterados.
3. Queries/RPCs/Edge Functions usadas.
4. O que foi removido.
5. O que ainda esta pendente.
6. Resultado do build/lint.
7. Riscos ou pontos de atencao.

## 29. Regra Final

**Kynovra Sales e um SaaS Command Center premium. Next.js e interface. Supabase e todo o backend. Nada de mocks, nada de backend local, nada de segredo no frontend.**

## 30. Divergencias Conhecidas

- `app/(admin)/notifications/page.tsx` ainda existe, mas a regra aprovada e manter notificacoes somente no sino da topbar.
- `/p/[productSlug]`, `/c/[campaignSlug]` e `/support` existem como rotas atuais, mas as rotas canonicas publicas sao `/a/[productSlug]`, `/room/[publicToken]`, `/suporte` e `/suporte/sala/[publicToken]`.
- O schema atual de `ai_agents` pode usar nomes legados como `internal_name` e `response_rules`; em novas alteracoes, preservar compatibilidade com o banco atual e evitar reintroduzir provider/modelo por agente.
- As rotas `/agents` e `/ai-settings` foram removidas; NEVER reintroduzir modulos separados de IA.
