import type { AgeCategory } from "@/generated/prisma/enums";

export const CATEGORY_LABEL: Record<AgeCategory, string> = {
  ADULT: "Adult",
  STUDENT: "Campus Student",
  TEEN: "Teenager",
  CHILD: "Child",
};
