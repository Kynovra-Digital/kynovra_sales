import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MetricCardProps } from "@/types/shared";

export function MetricCard({
  title,
  value,
  description,
  icon,
  trend,
  glow = "blue",
}: MetricCardProps) {
  const isNegative = trend?.trim().startsWith("-");

  return (
    <Card
      className={cn(
        "dashboard-card group relative min-h-[6.25rem] overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 sm:min-h-[6.75rem]",
        "before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        glow === "blue" && "shadow-[0_0_36px_rgb(37_99_235_/_0.12)]",
        glow === "purple" && "shadow-[0_0_36px_rgb(124_58_237_/_0.12)]",
        glow === "green" && "shadow-[0_0_36px_rgb(16_185_129_/_0.12)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-3xl transition-opacity duration-300 group-hover:opacity-90",
          glow === "blue" && "bg-kynovra-electric-blue/18",
          glow === "purple" && "bg-kynovra-tech-purple/18",
          glow === "green" && "bg-kynovra-digital-green/14",
        )}
      />
      <CardHeader className="relative flex flex-row items-start justify-between gap-2 px-4 pb-1 pt-4">
        <div className="min-w-0">
          <CardTitle className="font-medium text-muted-foreground text-xs leading-4">
            {title}
          </CardTitle>
          {description ? (
            <p className="mt-1 line-clamp-1 text-muted-foreground/75 text-xs">
              {description}
            </p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg border bg-white/[0.05] sm:size-9",
              glow === "blue" && "border-primary/25 text-blue-200",
              glow === "purple" &&
                "border-kynovra-tech-purple/30 text-purple-200",
              glow === "green" &&
                "border-kynovra-digital-green/25 text-kynovra-digital-green",
            )}
          >
            {icon}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="relative flex items-end justify-between gap-3 px-4 pb-4">
        <div className="min-w-0">
          <strong className="block whitespace-nowrap font-semibold text-2xl leading-tight tracking-normal sm:text-[1.65rem]">
            {value}
          </strong>
          {trend ? (
            <span
              className={cn(
                "mt-1.5 inline-flex w-fit rounded-md border px-2 py-0.5 font-medium text-xs",
                isNegative
                  ? "border-destructive/30 bg-destructive/10 text-red-200"
                  : "border-kynovra-digital-green/25 bg-kynovra-digital-green/10 text-kynovra-digital-green",
              )}
            >
              {trend}
            </span>
          ) : null}
        </div>
        <div
          className={cn(
            "mini-sparkline h-8 w-16 shrink-0 opacity-80 sm:w-[4.5rem]",
            glow === "blue" && "text-blue-300",
            glow === "purple" && "text-purple-300",
            glow === "green" && "text-kynovra-digital-green",
          )}
        />
      </CardContent>
    </Card>
  );
}
