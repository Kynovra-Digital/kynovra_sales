import { CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OnboardingChecklistProps } from "@/types/ux";

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle>Checklist inicial</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-3">
          {items.map((item) => {
            const Icon = item.completed ? CheckCircle2 : Circle;

            return (
              <li className="flex items-center gap-3 text-sm" key={item.label}>
                <Icon
                  aria-hidden="true"
                  className={
                    item.completed
                      ? "size-4 text-kynovra-digital-green"
                      : "size-4 text-muted-foreground"
                  }
                />
                <span>{item.label}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
