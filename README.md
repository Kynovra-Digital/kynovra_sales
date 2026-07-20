# Kynovra Sales

SaaS Command Center da **Kynovra Digital** que centraliza vendas, atendimento comercial, suporte pós-venda, campanhas, produtos, IA, tickets, métricas, notificações e auditoria em tempo real. Projetado para transformar operações digitais em marcas mais fortes, escaláveis e lucrativas.

## Sobre

A Kynovra Digital une marketing, tecnologia, e-commerce, software e estratégia para construir marcas digitais maiores. O Kynovra Sales é a plataforma proprietária onde atendentes, gestores e agentes de IA trabalham em conjunto para vender e apoiar clientes — do primeiro contato à pós-venda.

## Features

### Atendimento de Vendas
- Link público único por produto: cada produto gera seu próprio canal de atendimento.
- Fila operacional em tempo real: tickets chegam a quem pode atender.
- Drawer do atendente com chat + ferramentas (lead, produto, IA, ações, histórico).
- Checkout sob demanda: a área de checkout do cliente só aparece quando o atendente aciona.
- IA assume automaticamente se ninguém atender no tempo configurado.
- Avaliação 1–5 estrelas ao encerrar.

### Suporte Pós-Venda
- Sala única por cliente via `/suporte`.
- Código de continuidade para retomar conversas anteriores.
- Mesma fila, aceite e operação do atendimento de venda — sem checkout.

### Inteligência Artificial
- IA global configurada por organização.
- Agente de vendas e de suporte por produto, com comportamento próprio (prompt, tom, regras).
- Sugestões de resposta em tempo real para o atendente.
- Chamadas de IA rodam em backend dedicado, sem expor credenciais no navegador.

### Gestão Comercial
- **Produtos** com link público copiável e imagem própria.
- **Campanhas** com banner e produtos vinculados.
- **Leads e registros** comerciais com confirmação manual ou por checkout.
- **Estoque e disponibilidade** integrados ao atendimento.
- **Base de Conhecimento** para alimentar respostas da IA.
- **Hardness**: master prompts de venda/suporte por produto.

### Gestão do Time
- Grupos, membros e permissões granulares por funcionalidade.
- Papéis: Owner/Fundador (acesso total), Superadmin, Gestor, Admin, Supervisor e Colaboradores.
- Auditoria de ações críticas (aceite, transferência, confirmação de venda, mudança de IA e permissões).

### Dashboard e Relatórios
- Vendas confirmadas, receita estimada, checkouts enviados/acessados.
- Atendimentos e suportes ativos.
- Avaliação média, taxa de conversão, funil e timeline em tempo real.

### Identidade Visual
- Admin em tema escuro premium futurista (azul profundo, elétrico e roxo, com glow sutil).
- Área pública clara e comercial, optimizada para mobile.
- "Powered by Kynovra Sales" em todas as páginas públicas.

## Inovações

- **Visitor Identity**: ao acessar um link de produto, o visitante recebe uma identidade anônima que persiste por 1 dia. Voltar ao mesmo link recupera a conversa — sem precisar logar de novo.
- **Timeout humano com takeover de IA**: fila justa e atendimento sempre responde, nunca fica parado.
- **Hardness por produto**: cada produto pode ter uma "personalidade" de IA própria para venda e suporte.
- **Command Center** (Ctrl/Cmd+K): navegação rápida por todo o admin, filtrada pelas permissões reais do usuário.

## Plataforma

- Frontend em **Next.js** (App Router).
- Backend em **Supabase** (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- Deploy: **Vercel** (frontend) + **Supabase** (backend).

## Links Públicos

| Rota | Função |
|---|---|
| `/a/[produto]` | Atendimento de venda |
| `/room/[token]` | Sala pública de venda |
| `/suporte` | Atendimento de suporte |
| `/suporte/sala/[token]` | Sala pública de suporte |

## Para Desenvolvedores

Informações técnicas (instalação, ambiente, arquitetura, banco, deploy) e o conjunto de regras do projeto ficam em `AGENTS.md` e na pasta `docs/`. Credenciais, chaves de provedores e configurações sensíveis não são versionadas neste repositório.

## Status

Projeto em evolução ativa pela Kynovra Digital.
