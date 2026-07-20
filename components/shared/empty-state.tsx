import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { EmptyStateProps } from "@/types/shared";

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="dashboard-card overflow-hidden rounded-xl border-dashed">
      <CardContent className="relative flex min-h-64 flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="-top-16 absolute size-40 rounded-full bg-primary/10 blur-3xl" />
        <span className="relative flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-blue-100">
          <Sparkles className="size-5" />
        </span>
        <div className="flex max-w-md flex-col gap-1">
          <h2 className="font-semibold text-xl tracking-normal">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
