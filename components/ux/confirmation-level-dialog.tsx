"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ConfirmationLevelDialogProps } from "@/types/ux";

export function ConfirmationLevelDialog({
  level,
  actionLabel,
  keyword = "CONFIRMAR",
}: ConfirmationLevelDialogProps) {
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState("");
  const canConfirm =
    level === "light" ||
    (level === "medium" && checked) ||
    (level === "severe" && value === keyword);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={level === "severe" ? "destructive" : "outline"}>
          {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar acao</DialogTitle>
          <DialogDescription>
            Esta confirmacao esta preparada para respeitar permissoes e nao pula
            etapas criticas.
          </DialogDescription>
        </DialogHeader>
        {level === "medium" ? (
          <div className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
            <Checkbox
              id="medium-confirmation"
              checked={checked}
              onCheckedChange={(next) => setChecked(Boolean(next))}
            />
            <label htmlFor="medium-confirmation">
              Entendo que essa acao afetara os registros e a operacao do
              sistema.
            </label>
          </div>
        ) : null}
        {level === "severe" ? (
          <div className="flex flex-col gap-2">
            <label
              className="text-muted-foreground text-sm"
              htmlFor="severe-confirmation"
            >
              Digite <strong className="text-foreground">{keyword}</strong> para
              continuar.
            </label>
            <Input
              id="severe-confirmation"
              onChange={(event) => setValue(event.target.value)}
              value={value}
            />
          </div>
        ) : null}
        <DialogFooter>
          <Button
            disabled={!canConfirm}
            onClick={() => toast.success("Ação confirmada.")}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
