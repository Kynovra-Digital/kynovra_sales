import type { PageHeaderProps } from "@/types/layout";
import { Breadcrumbs } from "./breadcrumbs";

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <div className="relative">
      <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
          <div className="flex flex-col gap-1">
            <h1 className="text-balance font-semibold text-2xl tracking-normal md:text-[1.7rem] 2xl:text-[1.9rem]">
              {title}
            </h1>
            {description ? (
              <p className="max-w-3xl text-muted-foreground text-sm leading-5">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
