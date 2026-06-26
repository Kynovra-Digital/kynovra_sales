---
name: supabase-backend
description: Use para qualquer tarefa envolvendo Supabase Backend, PostgreSQL, RLS, RPC, Edge Functions, Storage, Auth, Realtime, tickets, mensagens, IA, auditoria e regras de negócio do Kynovra Sales.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: backend
---

# Supabase Backend — Kynovra Sales

Use esta skill quando trabalhar em qualquer parte do backend do Kynovra Sales.

## Regras principais

- Next.js é apenas frontend.
- Supabase é todo o backend.
- Não criar backend local em `app/api`.
- Não criar Server Actions críticas.
- Não usar mocks em telas finais.
- Não chamar provider de IA diretamente do frontend.
- Não expor service role no client.
- Não expor API key no frontend.

## Backend permitido

Toda regra de negócio deve estar em:

- PostgreSQL
- RLS
- Policies
- RPC/Postgres Functions
- Edge Functions
- Realtime
- Storage
- Auth

## Uploads

Toda imagem deve ir para Supabase Storage.

Buckets esperados:

- product-images
- campaign-banners
- organization-logos
- avatars
- public-assets
- support-attachments

Regra:

1. Fazer upload no bucket correto.
2. Obter URL pública ou path seguro.
3. Salvar URL/path no banco.
4. Nunca salvar base64 no banco.

## IA

Provider e LLM são globais por organização em `organization_ai_settings`.

Agentes IA não escolhem provider nem LLM.

## Tickets

Ticket de venda/suporte:

1. Cliente inicia sala.
2. Ticket entra como `waiting`.
3. Atendente aceita.
4. Ticket some para todos os outros.
5. Fica em “Meus atendimentos/suportes”.
6. Atendente abre.
7. Chat inicia.
8. Se ninguém aceitar no timeout, IA assume.

## Sempre verificar

- RLS
- organization_id
- policies
- storage policies
- foreign keys
- payload enviado
- types do Supabase
- Realtime
