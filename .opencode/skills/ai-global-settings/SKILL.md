---
name: ai-global-settings
description: Use para Configurações de IA, provider global, LLM global, fallback, teste de conexão, agentes IA e uso de modelos no Kynovra Sales.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: ai
---

# AI Global Settings

No Kynovra Sales, provider e LLM são globais por organização.

## Regra principal

A escolha fica somente em Configurações de IA.

Agentes IA não escolhem:

- provider
- LLM
- API key
- base URL
- fallback model

## Agentes IA

Agentes controlam:

- nome
- tipo
- prompt
- tom
- regras
- restrições
- contexto
- limites de uso
- status

## Configurações de IA

Campos:

- provider
- model
- API key protegida
- temperature
- max_output_tokens
- timeout_seconds
- fallback_enabled
- fallback_provider
- fallback_model
- ai_auto_takeover_enabled
- human_accept_timeout_seconds

## Chamada de IA

Nunca chamar provider direto no frontend.

Usar Supabase Edge Functions:

- ai-generate-response
- ai-auto-takeover
- test-ai-connection
