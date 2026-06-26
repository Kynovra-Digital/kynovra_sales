# OpenCode local — Kynovra Sales

Este projeto mantém a configuração do OpenCode localmente na raiz.

## Agentes

Somente dois agentes locais são permitidos:

- `plan`: planeja, audita e analisa. Não altera arquivos.
- `build`: planeja e executa alterações.

## Regras

- Não alterar `~/.config/opencode`.
- Não salvar secrets em `opencode.jsonc`, skills, agents ou commands.
- Skills ficam em `.opencode/skills/<name>/SKILL.md`.
- Commands devem usar apenas `agent: plan` ou `agent: build`.
