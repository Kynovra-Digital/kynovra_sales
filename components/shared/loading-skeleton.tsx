import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-11 w-72 max-w-full rounded-lg bg-white/[0.06]" />
      <div className="grid gap-4 md:grid-cols-4">
        <Skeleton className="h-36 rounded-xl bg-white/[0.055]" />
        <Skeleton className="h-36 rounded-xl bg-white/[0.055]" />
        <Skeleton className="h-36 rounded-xl bg-white/[0.055]" />
        <Skeleton className="h-36 rounded-xl bg-white/[0.055]" />
      </div>
      <Skeleton className="h-80 rounded-xl bg-white/[0.055]" />
    </div>
  );
}
