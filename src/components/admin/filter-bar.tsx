import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui";
import { Input, Select } from "@/components/ui/form";

/**
 * Plain GET form. Every filter ends up in the query string, so a filtered view
 * is a link the camp desk can send to a colleague, and it works with no JS.
 */
export function FilterBar({
  action,
  children,
  activeCount,
  searchName = "q",
  searchValue,
  searchPlaceholder = "Search name, email, phone or code",
  extra,
}: {
  action: string;
  children?: ReactNode;
  activeCount: number;
  searchName?: string;
  searchValue?: string;
  searchPlaceholder?: string;
  extra?: ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      className="flex flex-wrap items-end gap-3 border border-ink/12 bg-paper p-4"
    >
      <div className="min-w-[220px] flex-1">
        <label
          htmlFor={searchName}
          className="eyebrow mb-1.5 block text-ink-45"
        >
          Search
        </label>
        <Input
          id={searchName}
          name={searchName}
          defaultValue={searchValue}
          placeholder={searchPlaceholder}
          type="search"
        />
      </div>

      {children}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          Apply
        </Button>
        {activeCount > 0 ? (
          <Link
            href={action}
            className="px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-45 underline underline-offset-4 hover:text-ink"
          >
            Clear ({activeCount})
          </Link>
        ) : null}
        {extra}
      </div>
    </form>
  );
}

export function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel = "All",
}: {
  name: string;
  label: string;
  value?: string;
  options: { value: string; label: string }[];
  allLabel?: string;
}) {
  return (
    <div className="min-w-[150px]">
      <label htmlFor={name} className="eyebrow mb-1.5 block text-ink-45">
        {label}
      </label>
      <Select id={name} name={name} defaultValue={value ?? ""}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
