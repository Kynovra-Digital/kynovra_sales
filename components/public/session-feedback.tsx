"use client";

import { useMutation } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitPublicSessionFeedback } from "@/lib/supabase/queries/public";
import { cn } from "@/lib/utils";
import type { SessionFeedbackProps } from "@/types/public";

const QUESTIONS = [
  {
    id: "overall",
    label: "Como foi o atendimento?",
  },
  {
    id: "clarity",
    label: "As respostas foram claras?",
  },
  {
    id: "speed",
    label: "O tempo de resposta foi bom?",
  },
];

export function SessionFeedback({
  publicToken,
  sessionType,
}: SessionFeedbackProps) {
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({
    clarity: 0,
    overall: 0,
    speed: 0,
  });

  const canSubmit = QUESTIONS.every((question) => ratings[question.id] > 0);

  const mutation = useMutation({
    mutationFn: () =>
      submitPublicSessionFeedback({
        comment,
        publicToken,
        ratings,
        sessionType,
      }),
    onError: () => toast.error("Não foi possível enviar sua avaliação."),
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Obrigado pela avaliação.");
    },
  });

  if (submitted) {
    return (
      <div className="mt-7 rounded-3xl border border-emerald-200 bg-emerald-50/80 p-5 text-center shadow-sm">
        <p className="font-semibold text-emerald-900">Atendimento encerrado.</p>
        <p className="mt-2 text-emerald-800 text-sm">
          Obrigado por entrar em contato.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-7 rounded-3xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm">
      <p className="font-semibold text-slate-950">Avalie este atendimento</p>
      <p className="mt-1 text-slate-500 text-sm">
        Sua resposta ajuda a melhorar a experiência da Kynovra Sales.
      </p>

      <div className="mt-5 grid gap-4">
        {QUESTIONS.map((question) => (
          <div key={question.id}>
            <p className="mb-2 text-slate-700 text-sm font-medium">
              {question.label}
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                  className="rounded-lg p-1 transition hover:bg-amber-50"
                  key={`${question.id}-${value}`}
                  onClick={() =>
                    setRatings((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                  type="button"
                >
                  <Star
                    className={cn(
                      "size-7 transition",
                      ratings[question.id] >= value
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-300",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <label
            className="mb-2 block text-slate-700 text-sm font-medium"
            htmlFor="public-session-feedback-comment"
          >
            Comentário opcional
          </label>
          <Textarea
            className="min-h-20 resize-none rounded-2xl border-slate-200 bg-white"
            id="public-session-feedback-comment"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Conte como foi sua experiência..."
            value={comment}
          />
        </div>

        <Button
          className="h-11 rounded-2xl bg-blue-600 font-bold text-white hover:bg-blue-700"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate()}
          type="button"
        >
          {mutation.isPending ? "Enviando..." : "Enviar avaliação"}
        </Button>
      </div>
    </div>
  );
}
