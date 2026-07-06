# Kynovra Sales

Kynovra Sales e um SaaS interno/proprietario da Kynovra Digital para centralizar operacoes de vendas, atendimento comercial, suporte pos-venda, campanhas, produtos, IA, tickets, metricas, notificacoes, auditoria e operacao digital em tempo real.

O projeto segue a arquitetura aprovada em `AGENTS.md`: Next.js e somente a interface; Supabase e a fonte da verdade para backend, banco, autenticacao, RLS, storage, realtime, RPCs e Edge Functions.

## Visao Geral

- Painel admin em formato Command Center SaaS premium.
- Atendimento de vendas com fila, aceite de tickets, drawer operacional e suporte a IA.
- Suporte pos-venda com sala publica, continuidade e fluxo de aceite.
- Produtos, campanhas, leads, estoque, qualidade, equipe, auditoria e configuracoes.
- IA global configurada por organizacao, executada por Supabase Edge Functions.
- Notificacoes centralizadas no sino da topbar.
- Area publica clara/comercial para links de produto e suporte.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui e Radix UI
- TanStack Query e TanStack Table
- Zustand para estado visual/local
- React Hook Form e Zod
- Recharts
- TipTap
- Framer Motion
- Supabase Auth, PostgreSQL, RLS, Realtime, Storage, RPCs e Edge Functions
- Biome
- Vitest, Testing Library e Playwright
- pnpm

## Arquitetura

### Frontend

O frontend fica no Next.js e deve conter apenas interface, componentes, layouts, hooks de UI, validacao client-side, clientes Supabase, tipos, helpers visuais e integrações permitidas com Supabase.

### Backend

Toda regra de negocio operacional fica no Supabase:

- PostgreSQL e migrations
- Row Level Security
- RPCs e funcoes Postgres
- Edge Functions
- Auth
- Storage
- Realtime
- Cron, quando necessario

O projeto nao deve criar backend local em Next.js para regras de negocio e nao deve expor service role, tokens, chaves de provedores ou outros segredos no client.

## Estrutura Principal

```text
app/                         Rotas Next.js App Router
app/(admin)/                 Area administrativa autenticada
app/(auth)/                  Login, cadastro, convite e recuperacao
app/(public)/                Rotas publicas de produto, sala e suporte
components/                  Componentes de UI, layout, chat, publico e modulos
hooks/                       Hooks compartilhados
lib/                         Clientes, queries, tipos, permissoes, URLs e utilitarios
stores/                      Estado local de UI com Zustand
supabase/migrations/         Migrations e funcoes SQL
supabase/functions/          Supabase Edge Functions
tests/                       Testes unitarios/componentes
```

## Rotas Principais

### Admin

- `/dashboard`
- `/sales`
- `/post-sales-support`
- `/products`
- `/campaigns`
- `/leads`
- `/inventory`
- `/quality`
- `/team`
- `/audit`
- `/settings`

### Publicas Canonicas

- `/a/[productSlug]` para atendimento de produto
- `/room/[publicToken]` para sala publica de venda
- `/suporte` para suporte pos-venda
- `/suporte/sala/[publicToken]` para sala publica de suporte

Algumas rotas legadas ou divergentes ainda podem existir no codigo. Consulte `AGENTS.md` antes de alterar navegacao, notificacoes ou rotas publicas.

## Modulos

- Dashboard operacional com metricas reais via Supabase.
- Produtos com imagem em Supabase Storage e link publico copiavel.
- Campanhas com banners em Supabase Storage e vinculo com produtos.
- Atendimento de vendas com fila, aceite, abertura, transferencia, encerramento e chat.
- Suporte pos-venda com fila, continuidade, aceite, abertura e encerramento.
- Leads e registros comerciais.
- Estoque e disponibilidade.
- Relatorios de qualidade.
- Equipe, grupos e permissoes.
- Auditoria e historico.
- Configuracoes gerais, incluindo IA global por organizacao.

## Supabase

O Supabase concentra toda a camada de backend. As principais areas de dados incluem organizacoes, configuracoes, perfis, produtos, campanhas, leads, sessoes de venda, mensagens, sessoes de suporte, codigos de continuidade, agentes de IA, notificacoes, auditoria, estoque e avaliacoes.

As queries do frontend ficam em `lib/supabase/queries/*` e devem usar dados reais. Telas finais nao devem depender de mocks.

### Edge Functions

As funcoes ficam em `supabase/functions/` e incluem fluxos de IA, criacao de sessoes publicas, validacao de continuidade, gateway de modelos e envio de e-mail.

### Storage

Uploads devem ser enviados para Supabase Storage, salvando URL ou path no banco. Imagens ou arquivos nao devem ser salvos como base64.

Buckets previstos incluem imagens de produtos, banners de campanhas, logos, avatares, assets publicos e anexos de suporte.

## IA

A configuracao de IA e global por organizacao e fica em Configuracoes Gerais. Agentes de IA nao escolhem provider, modelo ou chaves. A execucao de IA deve ocorrer por Edge Functions e usar as configuracoes globais autorizadas.

## Regras Importantes

- Leia `AGENTS.md` antes de mudancas relevantes.
- Leia a documentacao local do Next.js 16 em `node_modules/next/dist/docs/` antes de alterar comportamento de Next.js.
- Nao crie `app/api` para regra de negocio operacional.
- Nao use mocks como dados finais.
- Nao hardcode dominios em links publicos.
- Nao exponha secrets no repositorio ou no frontend.
- Todo campo de formulario deve ter label visivel.
- Notificacoes devem permanecer no sino da topbar.
- Drawer operacional deve mostrar chat e ferramentas, sem duplicar listas ou cards do modulo.
- Area publica deve exibir `Powered by Kynovra Sales`.

## Desenvolvimento

Instale as dependencias com:

```bash
pnpm install
```

Execute o ambiente de desenvolvimento com:

```bash
pnpm dev
```

Scripts disponiveis:

```bash
pnpm check
pnpm lint
pnpm test:run
pnpm build
pnpm e2e
```

## Supabase Local

O projeto possui scripts auxiliares para ambiente Supabase local:

```bash
pnpm supabase:start
pnpm supabase:stop
pnpm supabase:reset
pnpm supabase:types
```

Use esses comandos somente quando o ambiente local estiver configurado e quando a operacao for apropriada. `supabase:reset` recria o banco local e deve ser usado com cuidado.

## Qualidade

Antes de finalizar alteracoes de codigo, rode quando possivel:

```bash
pnpm check
pnpm lint
pnpm test:run
pnpm build
```

Corrija a causa real de falhas, especialmente imports mortos, tipos quebrados, build quebrado, erros de RLS, buckets ausentes, colunas inexistentes e mutations silenciosas.

## Deploy

- Frontend: Vercel
- Backend: Supabase

Segredos, chaves de provedores, service role, SMTP, CORS e variaveis de Edge Functions devem ser configurados no ambiente apropriado da plataforma, nunca documentados com valores reais no README.

## Documentacao Interna

- `AGENTS.md`: regras principais do projeto e arquitetura aprovada.

## Status

Este projeto esta em evolucao ativa. Ao modificar rotas, fluxos de atendimento, suporte, IA, storage, notificacoes ou permissoes, preserve a arquitetura aprovada e mantenha Supabase como fonte da verdade.
