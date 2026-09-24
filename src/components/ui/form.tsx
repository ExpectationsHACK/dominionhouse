"use client";

import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const CONTROL =
  "w-full border border-ink/20 bg-paper px-3.5 py-3 text-[15px] text-ink placeholder:text-ink-45/70 transition-colors focus:border-meridian focus:outline-none disabled:bg-ink/5 disabled:text-ink-45";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="eyebrow text-ink-70">
        {label}
        {required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-ink-45">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 resize-y", className)} {...props} />;
}

type OptionData = { value: string; label: ReactNode; disabled: boolean };

function optionsFromChildren(children: ReactNode): OptionData[] {
  const list: OptionData[] = [];
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === "option") {
      const optionProps = child.props as ComponentProps<"option">;
      list.push({
        value: String(optionProps.value ?? ""),
        label: optionProps.children,
        disabled: Boolean(optionProps.disabled),
      });
    }
  });
  return list;
}

function nextEnabledIndex(options: OptionData[], from: number, direction: 1 | -1) {
  if (options.length === 0) return 0;
  let index = from;
  for (let i = 0; i < options.length; i++) {
    index = (index + direction + options.length) % options.length;
    if (!options[index]?.disabled) return index;
  }
  return from;
}

/**
 * A native <select> underneath (aria-hidden, off-screen) carries the real
 * value, name and required-ness, so form submission and constraint
 * validation, the wizard's step-gating in particular, are unchanged. The
 * dropdown a person actually sees and picks from is ours, portalled to
 * <body> so a table's overflow-x-auto scroller never clips it.
 */
export function Select({
  className,
  children,
  defaultValue,
  value,
  onChange,
  id,
  name,
  required,
  disabled,
}: ComponentProps<"select">) {
  const options = useMemo(() => optionsFromChildren(children), [children]);
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() =>
    isControlled ? String(value) : defaultValue !== undefined ? String(defaultValue) : "",
  );
  const currentValue = isControlled ? String(value) : internalValue;
  const selected = options.find((option) => option.value === currentValue);

  const nativeRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (nativeRef.current && nativeRef.current.value !== currentValue) {
      nativeRef.current.value = currentValue;
    }
  }, [currentValue]);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 4, left: rect.left, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    panelRef.current?.focus();

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, updatePosition]);

  function commit(nextValue: string) {
    if (!isControlled) setInternalValue(nextValue);
    if (nativeRef.current) {
      nativeRef.current.value = nextValue;
      nativeRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setOpen(false);
    buttonRef.current?.focus();
  }

  function openMenu() {
    if (disabled) return;
    setHighlighted(Math.max(0, options.findIndex((option) => option.value === currentValue)));
    setOpen(true);
  }

  function onButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    }
  }

  function onPanelKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => nextEnabledIndex(options, index, 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => nextEnabledIndex(options, index, -1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setHighlighted(nextEnabledIndex(options, -1, 1));
    } else if (event.key === "End") {
      event.preventDefault();
      setHighlighted(nextEnabledIndex(options, options.length, -1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[highlighted];
      if (option && !option.disabled) commit(option.value);
    }
  }

  return (
    <div className="relative">
      <select
        ref={nativeRef}
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        onChange={onChange}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {children}
      </select>

      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onButtonKeyDown}
        className={cn(CONTROL, "flex items-center justify-between gap-2 text-left", className)}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-ink-45/70")}>
          {selected?.label}
        </span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M2 4.5 6 8.5l4-4" strokeLinecap="square" />
        </svg>
      </button>

      {open && coords
        ? createPortal(
            <ul
              ref={panelRef}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={id}
              onKeyDown={onPanelKeyDown}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
              className="z-50 max-h-64 divide-y divide-ink/10 overflow-auto border border-ink bg-paper text-[15px] outline-none"
            >
              {options.map((option, index) => (
                <li
                  key={`${option.value}-${index}`}
                  role="option"
                  aria-selected={option.value === currentValue}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => !option.disabled && commit(option.value)}
                  className={cn(
                    "px-3.5 py-2.5",
                    option.disabled
                      ? "cursor-not-allowed text-ink-45/50"
                      : index === highlighted
                        ? "cursor-pointer bg-ink text-white"
                        : option.value === currentValue
                          ? "cursor-pointer bg-bone"
                          : "cursor-pointer",
                  )}
                >
                  {option.label}
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 border border-ink/15 p-3.5 transition-colors hover:border-ink/35", className)}>
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#0b0b0c]"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium leading-snug">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-ink-45">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

/** Radio rendered as a selectable card, used for gender, plan and ticket tier. */
export function RadioCard({
  label,
  description,
  meta,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string; meta?: ReactNode }) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-start gap-3 border border-ink/15 p-4 transition-colors hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white",
        className,
      )}
    >
      <input type="radio" className="sr-only" {...props} />
      <span
        aria-hidden="true"
        className="mt-1 h-3.5 w-3.5 shrink-0 border border-ink/35 group-has-[:checked]:border-brass group-has-[:checked]:bg-brass"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-sm font-semibold">{label}</span>
          {meta ? <span className="font-mono text-sm">{meta}</span> : null}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-ink-45 group-has-[:checked]:text-white/65">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
    >
      {message}
    </p>
  );
}

export function Fieldset({
  legend,
  description,
  children,
  className,
}: {
  legend: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("border-0 p-0", className)}>
      <legend className="mb-1 text-sm font-semibold">{legend}</legend>
      {description ? <p className="mb-3 text-xs text-ink-45">{description}</p> : null}
      {children}
    </fieldset>
  );
}
