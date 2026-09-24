"use client";

import { useFormStatus } from "react-dom";
import { Arrow, buttonClass, type ButtonSize, type ButtonVariant } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  pendingLabel = "Working…",
  variant = "solid",
  size = "md",
  className,
  withArrow = true,
  name,
  value,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  withArrow?: boolean;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      aria-busy={pending}
      className={cn(buttonClass({ variant, size }), className)}
    >
      {pending ? pendingLabel : children}
      {!pending && withArrow ? <Arrow /> : null}
    </button>
  );
}
