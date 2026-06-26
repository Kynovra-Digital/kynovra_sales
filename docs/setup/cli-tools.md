# CLI Tools

Este projeto usa `pnpm` como gerenciador principal. Não usar `npm` ou `yarn`, exceto quando uma CLI exigir de forma inevitável.

## pnpm

Gerenciador de pacotes aprovado para instalar dependências, executar scripts e manter lockfile do projeto.

Comandos esperados:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
```

## create-next-app

CLI usada para criar a base inicial do Next.js com App Router, TypeScript e Tailwind CSS.

Uso recomendado na próxima etapa:

```bash
pnpm dlx create-next-app@latest .
```

## supabase

Supabase CLI será usada para desenvolvimento local, autenticação com o projeto Supabase, Edge Functions, tipos e operações futuras do ambiente Supabase.

Instalar como dependência de desenvolvimento depois que o projeto existir:

```bash
pnpm add -D supabase
```

Antes de usar comandos específicos, consultar a ajuda da CLI:

```bash
pnpm supabase --help
```

## shadcn

CLI usada via `pnpm dlx` para inicializar e adicionar componentes shadcn/ui quando a interface começar.

Uso esperado depois da criação do app:

```bash
pnpm dlx shadcn@latest init
```

## vercel

Vercel CLI será usada para linkar o projeto, validar deploys e gerenciar configurações de ambiente quando necessário.

Uso recomendado via `pnpm dlx` ou dependência de desenvolvimento, conforme necessidade do projeto:

```bash
pnpm dlx vercel
```

ou:

```bash
pnpm add -D vercel
```

## biome

Biome será usado para lint e formatação como ferramenta principal de qualidade estática.

Instalar depois que o projeto existir:

```bash
pnpm add -D @biomejs/biome
```

## playwright

Playwright será usado para testes end-to-end.

Instalar depois que o projeto existir:

```bash
pnpm add -D @playwright/test
pnpm exec playwright install
```
