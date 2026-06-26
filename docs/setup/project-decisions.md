# Project Decisions

## Decisões aprovadas

- Arquitetura: monolito modular
- Backend principal: Supabase
- Frontend: Next.js App Router
- Linguagem: TypeScript
- UI: shadcn/ui + Tailwind CSS
- Data fetching/cache: TanStack Query
- Estado local: Zustand
- Formulários: React Hook Form
- Validação: Zod
- Tabelas: TanStack Table
- Gráficos: Recharts
- Rich text: TipTap
- Animações: Framer Motion
- Realtime: Supabase Realtime
- Storage: Supabase Storage
- Auth: Supabase Auth + RLS
- Edge Functions: Supabase Edge Functions em TypeScript
- E-mail: Resend
- IA: Vercel AI SDK
- Testes: Vitest + Testing Library + Playwright
- Lint/format: Biome
- Deploy: Vercel
- Versionamento: GitHub
- Billing futuro: gateway-neutral
- Multiempresa futura: `organization_id` em tabelas principais

## Diretrizes de base

- Não criar backend Node separado.
- O backend principal será Supabase.
- O projeto começa como app único Next.js, organizado para virar monorepo futuramente.
- Usar TypeScript em toda a base.
- Usar arquitetura modular desde o início.
- Não criar banco, migrations ou interface nesta etapa.
- Não armazenar secrets reais no repositório.
