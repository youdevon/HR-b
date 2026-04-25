import type { ReactNode } from "react";
import BackLink from "@/components/navigation/back-link";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export default function PageHeader({
  title,
  description,
  backHref,
  backLabel = "Back",
  actions,
}: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {backHref ? <BackLink href={backHref} label={backLabel} /> : null}

      <div className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-neutral-600">{description}</p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex w-full min-w-0 flex-col flex-wrap gap-2 sm:w-auto sm:flex-row sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
