export const shortcutGroups = [
  {
    label: "Global",
    shortcuts: [
      { keys: "Ctrl/Cmd + K", action: "Command Center" },
      { keys: "Ctrl/Cmd + B", action: "Recolher sidebar" },
      { keys: "Ctrl/Cmd + J", action: "Notificacoes" },
      { keys: "Ctrl/Cmd + /", action: "Central de ajuda" },
      { keys: "Ctrl/Cmd + Shift + F", action: "Modo foco" },
    ],
  },
  {
    label: "Atendimento",
    shortcuts: [
      { keys: "Ctrl/Cmd + Enter", action: "Enviar mensagem" },
      { keys: "Ctrl/Cmd + Shift + C", action: "Alternar Copiloto/IA" },
      { keys: "Ctrl/Cmd + Shift + O", action: "Chamar agente contextual" },
      { keys: "Ctrl/Cmd + Shift + K", action: "Enviar checkout" },
      { keys: "Ctrl/Cmd + Shift + E", action: "Encerrar atendimento" },
    ],
  },
  {
    label: "Suporte",
    shortcuts: [
      { keys: "Ctrl/Cmd + Enter", action: "Enviar mensagem" },
      { keys: "Ctrl/Cmd + Shift + G", action: "Gerar codigo" },
      { keys: "Ctrl/Cmd + Shift + R", action: "Marcar resolvido" },
      { keys: "Ctrl/Cmd + Shift + E", action: "Encerrar suporte" },
    ],
  },
  {
    label: "Drawers",
    shortcuts: [
      { keys: "Esc", action: "Fechar drawer" },
      { keys: "Ctrl/Cmd + S", action: "Salvar sem pular confirmacoes" },
    ],
  },
] as const;
