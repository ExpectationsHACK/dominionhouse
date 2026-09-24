import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { POSITION_OPTIONS } from "@/lib/positions";

export type RegistrantFilters = {
  q?: string;
  position?: string;
  category?: string;
  status?: string;
  gender?: string;
  room?: string;
  department?: string;
  lighthouse?: string;
  page?: string;
  sort?: string;
};

const POSITIONS = new Set<string>(POSITION_OPTIONS);
const CATEGORIES = new Set(["ADULT", "STUDENT", "TEEN", "CHILD"]);
const STATUSES = new Set(["PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED", "WAITLISTED"]);
const GENDERS = new Set(["MALE", "FEMALE"]);

export const PAGE_SIZE = 25;

/**
 * Turns the query string into a Prisma filter. Every value is checked against
 * a known set, a hand-edited URL can narrow the list, never break the query.
 */
export function buildRegistrantWhere(
  campId: string,
  filters: RegistrantFilters,
): Prisma.RegistrantWhereInput {
  const where: Prisma.RegistrantWhereInput = { campId };
  const and: Prisma.RegistrantWhereInput[] = [];

  const q = filters.q?.trim();
  if (q) {
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { registrationCode: { contains: q, mode: "insensitive" } },
        { department: { contains: q, mode: "insensitive" } },
        { lighthouse: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
        { ticket: { code: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  if (filters.position && POSITIONS.has(filters.position)) {
    and.push({ position: filters.position as never });
  }
  if (filters.category && CATEGORIES.has(filters.category)) {
    and.push({ category: filters.category as never });
  }
  if (filters.status && STATUSES.has(filters.status)) {
    and.push({ status: filters.status as never });
  }
  if (filters.gender && GENDERS.has(filters.gender)) {
    and.push({ gender: filters.gender as never });
  }
  if (filters.department?.trim()) {
    and.push({ department: { equals: filters.department.trim(), mode: "insensitive" } });
  }
  if (filters.lighthouse?.trim()) {
    and.push({ lighthouse: { equals: filters.lighthouse.trim(), mode: "insensitive" } });
  }

  if (filters.room === "assigned") and.push({ roomAssignment: { isNot: null } });
  if (filters.room === "unassigned") {
    and.push({ roomAssignment: { is: null } });
  }
  if (filters.room === "personal") and.push({ wantsPersonalAccommodation: true });

  if (and.length > 0) where.AND = and;
  return where;
}

export function buildRegistrantOrder(sort?: string): Prisma.RegistrantOrderByWithRelationInput[] {
  switch (sort) {
    case "name":
      return [{ lastName: "asc" }, { firstName: "asc" }];
    case "oldest":
      return [{ createdAt: "asc" }];
    case "owing":
      return [{ status: "asc" }, { createdAt: "desc" }];
    case "position":
      return [{ position: "asc" }, { lastName: "asc" }];
    default:
      return [{ createdAt: "desc" }];
  }
}

export function countActiveFilters(filters: RegistrantFilters) {
  return [
    filters.q,
    filters.position,
    filters.category,
    filters.status,
    filters.gender,
    filters.room,
    filters.department,
    filters.lighthouse,
  ].filter((value) => Boolean(value?.trim())).length;
}

export function parsePage(page?: string) {
  const parsed = Number.parseInt(page ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
