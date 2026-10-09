import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-surface px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-5 h-1 w-16 rounded-full bg-accent" />
      <h2 className="text-xl font-semibold tracking-normal text-primary">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-foreground/65">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
