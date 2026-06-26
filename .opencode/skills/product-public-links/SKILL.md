---
name: product-public-links
description: Use para links públicos de atendimento por produto, link único de suporte, salas públicas, domínio dinâmico e tokens públicos seguros.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: public-routes
---

# Product Public Links

## Regra de links

Cada produto tem link próprio de atendimento:

`/a/[productSlug]`

O suporte tem link único global:

`/suporte`

Cada acesso cria uma sala única com `publicToken`.

## Domínio dinâmico

Não hardcodar domínio.

Usar origem atual:

- localhost
- IP de rede local
- domínio hospedado
- NEXT_PUBLIC_APP_URL, se configurado

## Salas

Venda:

- `/room/[publicToken]`

Suporte:

- `/suporte/sala/[publicToken]`

## UX pública

1. Cliente acessa link.
2. Modal pede nome/e-mail.
3. Cliente inicia.
4. Tela de loader.
5. Chat só abre quando humano aceita ou IA assume.
