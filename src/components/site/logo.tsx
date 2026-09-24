import Image from "next/image";
import logo from "../../../public/dominion-house-logo.png";
import { cn } from "@/lib/utils";

/**
 * The Dominion House mark.
 *
 * Statically imported so Next can size it and serve a blurred placeholder;
 * the source is the supplied JPEG with its black field keyed out to alpha.
 * Decorative by default, the wordmark beside it carries the name, so it is
 * hidden from assistive tech unless a `label` is passed.
 */
export function Logo({
  className,
  label,
  priority = false,
}: {
  className?: string;
  label?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={logo}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      priority={priority}
      className={cn("h-8 w-auto select-none", className)}
      sizes="(max-width: 640px) 40px, 64px"
    />
  );
}
