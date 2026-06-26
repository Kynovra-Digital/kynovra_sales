---
name: supabase-realtime-crm
description: Use para filas de atendimento, suporte, mensagens de chat, notificações, tickets e sincronização em tempo real com Supabase Realtime.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: realtime
---

# Supabase Realtime CRM

Use esta skill para qualquer fluxo em tempo real.

## Tabelas realtime

- sales_sessions
- support_sessions
- sales_messages
- support_messages
- notifications
- campaign_tracking_events

## Regras de ticket

Ticket waiting:

- aparece para atendentes permitidos
- botão Aceitar

Ticket accepted:

- some da fila dos outros
- aparece para quem aceitou

Ticket in_progress:

- chat ativo
- mensagens em tempo real

Ticket closed:

- sai da operação

## Sala pública

Cliente fica em loader até:

- humano aceitar
- IA assumir por timeout

Chat público só aparece depois disso.

## Notificações

Notificações ficam somente na topbar, no sino.
Não existe página de notificações internas.
