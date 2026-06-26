---
name: build-check
description: Use para validar lint, TypeScript, build, imports mortos, tipos Supabase e erros de integração no Kynovra Sales.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: quality
---

# Build Check

Use antes de considerar qualquer tarefa finalizada.

## Comandos

Rodar quando possível:

```bash
pnpm check
pnpm lint
pnpm build
pnpm test:run
```

Se algum script não existir, verificar `package.json`.

## Corrigir

- imports mortos
- types quebrados
- propriedades inexistentes
- erro de build
- componentes não usados
- queries inválidas
- payloads incorretos
- hooks fora de client component
- problemas de React Server/Client Components

## Relatório final

Informar:

- comandos rodados
- erros encontrados
- correções feitas
- pendências reais
