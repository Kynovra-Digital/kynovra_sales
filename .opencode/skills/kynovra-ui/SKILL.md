---
name: kynovra-ui
description: Use para qualquer tarefa de UI/UX do Kynovra Sales, incluindo layout SaaS premium, responsividade, shadcn/ui, Tailwind, sidebar, topbar, dashboard, drawers, formulários, chats e páginas públicas.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: frontend-ui
---

# Kynovra UI Premium

A interface deve parecer uma central de comando SaaS premium.

## Estilo visual

- Dark premium no painel administrativo.
- Visual futurista, tecnológico, limpo e sofisticado.
- Inspirado em Discord, Slack, Linear e dashboards SaaS modernos.
- Área pública clara/comercial premium.
- Sem aparência de template genérico.

## Paleta

- Azul Profundo: #0D132B
- Azul Elétrico: #2563EB
- Roxo Tecnológico: #7C3AED
- Verde Digital: #10B981
- Cinza Grafite: #1F2937
- Cinza Claro: #E5E7EB
- Branco: #FFFFFF

## Layout

Desktop:

- Sidebar fixa
- Topbar fixa
- Workspace principal
- Painéis com scroll próprio

Tablet:

- Sidebar vira drawer
- Painéis laterais viram drawer

Mobile:

- App-shell mobile
- Cards no lugar de tabelas
- Chat fullscreen
- Ações em bottom sheet

## Regras obrigatórias

- Sem cards duplicados.
- Sem scroll horizontal global.
- Todo campo de formulário tem label.
- Drawer de criação usa wizard com Voltar/Próximo.
- Drawer operacional de atendimento/suporte mostra apenas chat + ferramentas.
- Lista de tickets fica apenas na página principal.
- Notificações ficam somente no sino da topbar.
- O chat público só aparece quando humano aceita ou IA assume.
