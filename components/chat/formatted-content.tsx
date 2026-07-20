"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import type { FormattedContentProps, InlineSegmentProps } from "@/types/chat";

/**
 * Faz o parse mínimo de markdown inline para chat de atendimento.
 * Suporta **texto** -> <strong> e URLs http(s) clicáveis.
 * Não interpreta HTML nem outras marcações, evitando XSS.
 */
const BOLD_PATTERN = /\*\*(.+?)\*\*/g;
const URL_PATTERN = /(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/g;
const URL_ONLY_PATTERN = /^https?:\/\/[^\s<]+[^\s<.,:;"')\]]$/;

export function FormattedContent({
  children,
  className,
}: FormattedContentProps) {
  if (!children) return null;

  // split com grupo de captura alterna: índices pares = texto comum,
  // índices ímpares = conteúdo capturado entre ** (negrito).
  const parts = children.split(BOLD_PATTERN);

  return (
    <span
      className={cn("chat-message whitespace-pre-wrap break-words", className)}
    >
      {parts.map((part, index) => {
        if (index % 2 === 1) {
          // biome-ignore lint/suspicious/noArrayIndexKey: split determinístico; a posição define se o trecho é negrito ou texto comum.
          return <InlineSegment isBold key={part + index} text={part} />;
        }
        // biome-ignore lint/suspicious/noArrayIndexKey: split determinístico; a posição define se o trecho é negrito ou texto comum.
        return <InlineSegment key={part + index} text={part} />;
      })}
    </span>
  );
}

function InlineSegment({ isBold = false, text }: InlineSegmentProps) {
  const parts = text.split(URL_PATTERN);
  const content = parts.map((part, index) => {
    if (URL_ONLY_PATTERN.test(part)) {
      return (
        <a
          className="mt-2 inline-flex w-fit items-center justify-center rounded-xl border border-current/20 bg-current/10 px-3 py-2 font-bold text-xs transition hover:bg-current/15"
          href={part}
          // biome-ignore lint/suspicious/noArrayIndexKey: split determinístico de texto; não há reordenação nem estado local por item.
          key={part + index}
          rel="noopener noreferrer"
          target="_blank"
        >
          Abrir link seguro
        </a>
      );
    }
    // biome-ignore lint/suspicious/noArrayIndexKey: split determinístico de texto; não há reordenação nem estado local por item.
    return <Fragment key={part + index}>{part}</Fragment>;
  });

  if (isBold) {
    return <strong className="font-bold">{content}</strong>;
  }

  return <>{content}</>;
}
