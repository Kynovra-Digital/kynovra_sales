---
name: debug-functional
description: Use quando houver erro em formulários, Supabase, uploads, mutations, RLS, Storage, Realtime, build, telas quebradas ou funções que não salvam.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: debugging
---

# Debug Funcional — Kynovra Sales

Use esta skill quando algo não funcionar.

## Processo obrigatório

1. Reproduzir o erro.
2. Ler console do navegador.
3. Ler terminal.
4. Ler logs do Supabase, se disponíveis.
5. Identificar a causa real.
6. Corrigir a causa, não esconder erro.
7. Testar de novo.
8. Rodar lint/build quando possível.

## Problemas comuns

- RLS bloqueando insert/update.
- `organization_id` ausente.
- Campo diferente do schema.
- Bucket inexistente.
- Policy de Storage ausente.
- Payload incorreto.
- Query usando coluna que não existe.
- Type desatualizado.
- Mutation sem tratamento de erro.
- Dados mockados misturados com Supabase.
- Componente renderizando duplicado.

## Regra

Nunca resolver erro de RLS desativando segurança.

Corrigir policy, RPC, payload, usuário, profile ou organização.
