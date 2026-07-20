"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Upload, User, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  insertManualProductEvaluation,
  listProducts,
} from "@/lib/supabase/queries/products";
import { queryKeys } from "@/lib/supabase/query-keys";
import { uploadFileToBucket } from "@/lib/supabase/storage/upload-file";
import { cn } from "@/lib/utils";
import type { ManualEvaluationDialogProps } from "@/types/chat";

export function ManualEvaluationDialog({
  productId,
  open,
  onOpenChange,
}: ManualEvaluationDialogProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(productId ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const { data: products = [] } = useQuery({
    queryFn: () => listProducts(),
    queryKey: queryKeys.products.list,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      let avatarUrl: string | null = null;

      if (avatarFile) {
        const uploaded = await uploadFileToBucket({
          bucket: "avatars",
          file: avatarFile,
          fileNamePrefix: `manual-eval-${Date.now()}`,
          folder: "evaluations",
        });
        avatarUrl = uploaded?.path ?? null;
      }

      return insertManualProductEvaluation({
        productId: selectedProductId,
        rating,
        comment: comment.trim() || null,
        ratings: avatarUrl
          ? { customer_name: customerName, avatar_url: avatarUrl }
          : { customer_name: customerName },
      });
    },
    onError: (error) => {
      console.error(error);
      toast.error(
        "Não foi possível inserir a avaliação. Verifique os dados e tente novamente.",
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.qualification,
      });
      toast.success("Avaliação inserida com sucesso!");
      handleClose();
    },
  });

  function handleClose() {
    onOpenChange(false);
    setRating(0);
    setHoverRating(0);
    setComment("");
    setCustomerName("");
    setAvatarFile(null);
    setAvatarPreview("");
    if (!productId) {
      setSelectedProductId("");
    }
  }

  function handleAvatarChange(file: File | null) {
    if (!file) return;

    setAvatarFile(file);
    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedProductId) {
      toast.error("Selecione um produto.");
      return;
    }

    if (rating === 0) {
      toast.error("Selecione uma nota de 1 a 5 estrelas.");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Informe o nome da pessoa.");
      return;
    }

    mutation.mutate();
  }

  return (
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogContent className="max-w-lg border-white/10 bg-[#050a18] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Inserir Avaliação Manual
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Adicione uma avaliação de produto manualmente com dados do
                cliente.
              </DialogDescription>
            </div>
            <Button
              className="h-8 w-8 p-0"
              onClick={() => handleClose()}
              size="icon"
              variant="ghost"
            >
              <X className="size-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {!productId && (
              <div className="space-y-2">
                <Label
                  className="text-sm font-semibold text-white"
                  htmlFor="product-id"
                >
                  Produto <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="border-white/10 bg-white/[0.02] text-white">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-white"
                htmlFor="customer-name"
              >
                Nome da Pessoa <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <Input
                  id="customer-name"
                  className="border-white/10 bg-white/[0.02] text-white"
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Ex: João Silva"
                  value={customerName}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-white"
                htmlFor="customer-avatar"
              >
                Foto de Perfil{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <div className="flex items-center gap-3">
                {avatarPreview ? (
                  <div className="relative size-16 overflow-hidden rounded-full border border-white/10">
                    <Image
                      alt="Preview do avatar"
                      className="object-cover"
                      fill
                      sizes="64px"
                      src={avatarPreview}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex size-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.02]">
                    <User className="size-6 text-muted-foreground" />
                  </div>
                )}
                <Input
                  id="customer-avatar"
                  accept="image/*"
                  className="hidden"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleAvatarChange(file);
                  }}
                />
                <Button
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById("customer-avatar")?.click();
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="size-3.5" />
                  {avatarPreview ? "Trocar foto" : "Enviar foto"}
                </Button>
                {avatarPreview && (
                  <Button
                    onClick={(event) => {
                      event.preventDefault();
                      setAvatarFile(null);
                      setAvatarPreview("");
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Remover
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-xs">
                JPG, PNG ou WebP. Máximo 2MB.
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-white">
                Nota <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={cn(
                      "transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-[#050a18] rounded",
                    )}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    aria-label={`Nota ${star} de 5`}
                  >
                    <Star
                      className={cn(
                        "size-10 transition-all",
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                          : "fill-white/5 text-white/20",
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm font-medium text-amber-400"
                >
                  {rating === 1 && "Muito insatisfeito"}
                  {rating === 2 && "Insatisfeito"}
                  {rating === 3 && "Neutro"}
                  {rating === 4 && "Satisfeito"}
                  {rating === 5 && "Muito satisfeito"}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                className="text-sm font-semibold text-white"
                htmlFor="evaluation-comment"
              >
                Comentário{" "}
                <span className="text-muted-foreground">(opcional)</span>
              </Label>
              <Textarea
                id="evaluation-comment"
                className="min-h-24 resize-y border-white/10 bg-white/[0.02] text-white placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                onChange={(event) => setComment(event.target.value)}
                placeholder="Descreva a experiência, pontos positivos, negativos ou qualquer observação relevante..."
                value={comment}
              />
              <p className="text-muted-foreground text-xs">
                Este comentário aparecerá na lista de avaliações do produto.
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">
                ℹ️ Esta avaliação será marcada como "manual" e aparecerá junto
                com as avaliações automáticas dos atendimentos.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 sm:justify-between">
            <Button
              onClick={handleClose}
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button
              disabled={mutation.isPending || rating === 0}
              type="submit"
              className="bg-primary hover:bg-primary/90"
            >
              {mutation.isPending ? "Salvando..." : "Inserir Avaliação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
