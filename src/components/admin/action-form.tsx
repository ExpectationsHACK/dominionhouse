"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { Notice } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ActionState = { ok?: string; error?: string };

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Every admin mutation is a plain form posting to a server action. This wrapper
 * only adds the pending state and the result message, so each panel stays a
 * server component with one small island inside it.
 */
export function ActionForm({
  action,
  children,
  className,
  confirm,
}: {
  action: ServerAction;
  children: ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  return (
    <form
      action={formAction}
      className={cn("space-y-3", className)}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}
      {state.ok ? <Notice tone="success">{state.ok}</Notice> : null}
      {children}
    </form>
  );
}
