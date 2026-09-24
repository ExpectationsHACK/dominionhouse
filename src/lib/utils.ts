import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function fullName(p: { firstName: string; lastName: string }) {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/[\s_]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Reduce a phone number to comparable digits.
 *
 * People type the same Nigerian number as 0803…, +234803… or with spaces, so
 * comparisons work on the national significant number: the last nine digits,
 * which is what actually identifies the line.
 */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function phonesMatch(a: string, b: string): boolean {
  const left = phoneDigits(a);
  const right = phoneDigits(b);
  if (!left || !right) return false;
  if (left === right) return true;

  const tail = (value: string) => value.slice(-9);
  return tail(left).length === 9 && tail(left) === tail(right);
}
