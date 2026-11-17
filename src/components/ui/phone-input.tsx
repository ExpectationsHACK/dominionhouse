"use client";

import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/** Countries shown first, where the house has Lighthouses or most members. */
const PINNED: CountryCode[] = ["NG", "GB", "CA", "TT", "US", "GH"];

type Country = { code: CountryCode; name: string; dial: string };

function buildCountries(): Country[] {
  const names = new Intl.DisplayNames(["en"], { type: "region" });
  const all = getCountries().map((code) => ({
    code,
    name: names.of(code) ?? code,
    dial: `+${getCountryCallingCode(code)}`,
  }));
  const pinned = PINNED.map((code) => all.find((country) => country.code === code)!).filter(Boolean);
  const rest = all
    .filter((country) => !PINNED.includes(country.code))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...pinned, ...rest];
}

const countries = buildCountries();

/** The full number in international form (+234…), or "" when it isn't complete. */
export function completePhone(national: string, country: CountryCode): string {
  const trimmed = national.trim();
  if (!trimmed) return "";
  const parsed = trimmed.startsWith("+")
    ? parsePhoneNumberFromString(trimmed)
    : parsePhoneNumberFromString(trimmed, country);
  return parsed && isValidPhoneNumber(parsed.number) ? parsed.number : "";
}

function Flag({ code, className }: { code: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${code}.svg`}
      alt=""
      width={21}
      height={14}
      loading="lazy"
      data-keep-tone
      className={cn("h-3.5 w-[21px] shrink-0 border border-ink/10 object-cover", className)}
    />
  );
}

/**
 * A phone number with a country-code picker (flag + dialling code). Posts the
 * full international number as `name` (e.g. +2348031234567) and refuses to
 * submit until the number is complete for the chosen country.
 */
export function PhoneInput({
  id,
  name,
  defaultCountry = "NG",
  required,
  invalid,
}: {
  id: string;
  name: string;
  defaultCountry?: CountryCode;
  required?: boolean;
  invalid?: boolean;
}) {
  const [country, setCountry] = useState<CountryCode>(defaultCountry);
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const current = countries.find((item) => item.code === country) ?? countries[0];
  const full = completePhone(national, country);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return countries;
    return countries.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.dial.slice(1).startsWith(q) ||
        item.code.toLowerCase() === q,
    );
  }, [query]);

  // The browser's own check: an incomplete number can't be submitted.
  useEffect(() => {
    const input = numberRef.current;
    if (!input) return;
    input.setCustomValidity(
      national.trim() && !full ? `Enter the full number for ${current.name} (${current.dial}).` : "",
    );
  }, [national, full, current]);

  useEffect(() => {
    if (!open) return;
    function updatePosition() {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) setCoords({ top: rect.bottom + 4, left: rect.left, width: Math.min(rect.width, 360) });
    }
    updatePosition();
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
  }, [open]);

  // The panel renders once it has a position; then the search box takes focus.
  const panelShown = open && coords !== null;
  useEffect(() => {
    if (panelShown) searchRef.current?.focus();
  }, [panelShown]);

  // Keep the highlighted country in view while arrowing through the list.
  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-index="${highlighted}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [highlighted, open]);

  function openMenu() {
    setQuery("");
    setHighlighted(Math.max(0, countries.findIndex((item) => item.code === country)));
    setOpen(true);
  }

  function choose(code: CountryCode) {
    setCountry(code);
    setOpen(false);
    numberRef.current?.focus();
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => Math.min(filtered.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filtered[highlighted];
      if (item) choose(item.code);
    }
  }

  function onNumberChange(value: string) {
    // A pasted +44… switches the country to match.
    if (value.trim().startsWith("+")) {
      const parsed = parsePhoneNumberFromString(value.trim());
      if (parsed?.country) {
        setCountry(parsed.country);
        setNational(parsed.formatNational());
        return;
      }
    }
    setNational(value.length > national.length ? new AsYouType(country).input(value) : value);
  }

  return (
    <div
      ref={wrapRef}
      className={cn(
        "flex border bg-paper text-ink transition-colors focus-within:border-meridian",
        invalid ? "border-danger" : "border-ink/20",
      )}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Country code: ${current.name} ${current.dial}. Change`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(event) => {
          if (!open && ["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            openMenu();
          }
        }}
        className="flex shrink-0 items-center gap-2 border-r border-ink/15 px-3 text-[15px] font-medium outline-none hover:bg-brass-soft/60 focus-visible:bg-brass-soft"
      >
        <Flag code={current.code} />
        <span className="tabular-nums">{current.dial}</span>
        <svg viewBox="0 0 12 12" aria-hidden="true" className={cn("h-3 w-3 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M2 4.5 6 8.5l4-4" strokeLinecap="square" />
        </svg>
      </button>

      <input
        ref={numberRef}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        required={required}
        value={national}
        onChange={(event) => onNumberChange(event.target.value)}
        placeholder={country === "NG" ? "803 123 4567" : "Phone number"}
        aria-invalid={invalid || (national.trim() !== "" && !full) || undefined}
        className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[15px] outline-none placeholder:text-ink-45/70"
      />
      <input type="hidden" name={name} value={full || (national.trim() ? `${current.dial} ${national}` : "")} />

      {open && coords
        ? createPortal(
            <div
              ref={panelRef}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: coords.width }}
              className="z-50 border border-ink bg-paper text-[15px] shadow-lg"
            >
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setHighlighted(0);
                }}
                onKeyDown={onSearchKeyDown}
                placeholder="Search country or code"
                aria-label="Search country or code"
                aria-controls={listId}
                aria-activedescendant={filtered[highlighted] ? `${listId}-${filtered[highlighted].code}` : undefined}
                className="w-full border-b border-ink/15 bg-transparent px-3.5 py-3 outline-none placeholder:text-ink-45/70"
              />
              <ul id={listId} role="listbox" aria-label="Country codes" className="max-h-64 overflow-auto">
                {filtered.length === 0 ? (
                  <li className="px-3.5 py-3 text-ink-45">No country matches.</li>
                ) : (
                  filtered.map((item, index) => (
                    <li
                      key={item.code}
                      id={`${listId}-${item.code}`}
                      data-index={index}
                      role="option"
                      aria-selected={item.code === country}
                      onPointerEnter={() => setHighlighted(index)}
                      onClick={() => choose(item.code)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-3.5 py-2.5",
                        index === highlighted && "bg-brass-soft",
                        item.code === country && "font-semibold",
                        index === PINNED.length - 1 && !query && "border-b border-ink/15",
                      )}
                    >
                      <Flag code={item.code} />
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      <span className="tabular-nums text-ink-45">{item.dial}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
