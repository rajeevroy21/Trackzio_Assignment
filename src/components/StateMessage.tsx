import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function StateMessage({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: ReactNode;
}) {
  return (
    <div className="surface-panel mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
      {icon}
      <h2 className="text-2xl text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && (
        <Button className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
