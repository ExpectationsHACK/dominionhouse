import type { Prisma } from "@/generated/prisma/client";

export type SgbFilters = { q?: string; location?: string; gender?: string; email?: string };

/** The table's filters, shared by the page and the CSV export. */
export function sgbWhere(filters: SgbFilters): Prisma.SgbRegistrationWhereInput {
  const and: Prisma.SgbRegistrationWhereInput[] = [];
  const q = filters.q?.trim();
  if (q) {
    const digits = q.replace(/\D/g, "");
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { country: { contains: q, mode: "insensitive" } },
        ...(digits.length >= 4 ? [{ phone: { contains: digits.slice(-9) } }] : []),
      ],
    });
  }
  if (filters.location === "Others") and.push({ location: { startsWith: "Others" } });
  else if (filters.location) and.push({ location: filters.location });
  if (filters.gender === "Male" || filters.gender === "Female") and.push({ gender: filters.gender });
  if (filters.email === "yes") and.push({ email: { not: null } });
  if (filters.email === "no") and.push({ email: null });
  return and.length ? { AND: and } : {};
}
