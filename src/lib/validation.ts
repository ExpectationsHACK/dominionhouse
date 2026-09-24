import { z } from "zod";
import { POSITION_OPTIONS } from "@/lib/positions";

const NG_PHONE = /^(\+?234|0)[789][01]\d{8}$/;

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a phone number")
  .refine((value) => NG_PHONE.test(value.replace(/[\s-]/g, "")) || /^\+\d{8,15}$/.test(value.replace(/[\s-]/g, "")), {
    message: "Enter a valid phone number, e.g. 0803 123 4567",
  });

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

/** Step 1, who you are. */
export const identityStep = z.object({
  registeringAs: z.enum(["ADULT", "STUDENT", "TEEN", "CHILD"], {
    message: "Choose who this registration is for",
  }),
  firstName: z.string().trim().min(2, "Enter your first name").max(60),
  lastName: z.string().trim().min(2, "Enter your last name").max(60),
  email: emailSchema,
  phone: phoneSchema,
  gender: z.enum(["MALE", "FEMALE"], { message: "Select a gender" }),
});

/** Step 2, where you serve. */
export const churchStep = z.object({
  position: z.enum(POSITION_OPTIONS, { message: "Choose your position" }),
  branch: z.string().trim().max(80).optional().or(z.literal("")),
  lighthouse: z.string().trim().max(80).optional().or(z.literal("")),
  region: z.string().trim().max(80).optional().or(z.literal("")),
  isFirstCamp: z.coerce.boolean().optional(),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
});

/** Step 3, logistics and care. */
export const logisticsStep = z.object({
  wantsPersonalAccommodation: z.coerce.boolean().optional(),
  transportNeeded: z.coerce.boolean().optional(),
  emergencyName: z.string().trim().min(2, "Enter an emergency contact name").max(80),
  emergencyPhone: phoneSchema,
  emergencyRelation: z.string().trim().max(40).optional().or(z.literal("")),
  medicalNotes: z.string().trim().max(600).optional().or(z.literal("")),
  allergies: z.string().trim().max(600).optional().or(z.literal("")),
});

/** Step 4, ticket and terms. */
export const ticketStep = z.object({
  paymentPlan: z.enum(["FULL", "INSTALLMENT"]),
  installmentChoice: z.enum(["2", "3", "4", "5", "CUSTOM"]).optional(),
  customFirstAmountNaira: z.coerce.number().int().min(0).optional(),
  consentPhoto: z.coerce.boolean().optional(),
  agreeTerms: z.literal("on", { message: "You need to accept the camp guidelines to register" }),
});

export const registrationSchema = identityStep
  .merge(churchStep)
  .merge(logisticsStep)
  .merge(ticketStep);

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const payAmountSchema = z.object({
  registrantId: z.string().min(1),
  mode: z.enum(["FULL", "PART"]),
  amountNaira: z.coerce.number().optional(),
});

/** Camp profile sign-in: the two things every registrant gave us. */
export const portalLoginSchema = z.object({
  email: emailSchema,
  phone: z.string().trim().min(7, "Enter the phone number you registered with"),
});

export const portalVerifySchema = z.object({
  email: emailSchema,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
});

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password"),
});

export const visitorSchema = z.object({
  firstName: z.string().trim().min(2, "Enter your first name").max(60),
  lastName: z.string().trim().min(2, "Enter your last name").max(60),
  email: emailSchema,
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  campus: z.string().trim().max(80).optional().or(z.literal("")),
  visitDate: z.string().optional().or(z.literal("")),
  howHeard: z.string().trim().max(120).optional().or(z.literal("")),
  prayerRequest: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const roomSchema = z.object({
  block: z.string().trim().min(1, "Enter a block"),
  name: z.string().trim().min(1, "Enter a room name or number"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1").max(200),
  gender: z.enum(["MALE", "FEMALE", "MIXED"]),
  type: z.enum(["DORMITORY", "SHARED", "PRIVATE", "FAMILY"]),
  floor: z.string().trim().max(30).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  minPosition: z.string().optional().or(z.literal("")),
});

export const offlinePaymentSchema = z.object({
  registrantId: z.string().min(1),
  amountNaira: z.coerce.number().positive("Enter an amount greater than zero"),
  method: z.enum(["BANK_TRANSFER", "CASH", "POS", "WAIVER"]),
  reference: z.string().trim().max(80).optional().or(z.literal("")),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const scheduleItemSchema = z.object({
  day: z.string().min(1, "Pick a day"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM").optional().or(z.literal("")),
  title: z.string().trim().min(2, "Give the session a title").max(120),
  description: z.string().trim().max(600).optional().or(z.literal("")),
  speaker: z.string().trim().max(80).optional().or(z.literal("")),
  location: z.string().trim().max(80).optional().or(z.literal("")),
  type: z.enum(["SERVICE", "SESSION", "PRAYER", "MEAL", "ACTIVITY", "BREAKOUT", "LOGISTICS"]),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2, "Give the announcement a title").max(140),
  body: z.string().trim().min(2, "Write the announcement").max(4000),
  isPinned: z.coerce.boolean().optional(),
  emailEveryone: z.coerce.boolean().optional(),
});

export const pricingSchema = z.object({
  adult: z.coerce.number().min(0),
  student: z.coerce.number().min(0),
  teen: z.coerce.number().min(0),
  child: z.coerce.number().min(0),
  installmentsEnabled: z.coerce.boolean().optional(),
  minFirstInstallmentNaira: z.coerce.number().int().min(0).max(10_000_000),
  requireFullPayForRoom: z.coerce.boolean().optional(),
});

/** Site-relative ("/camp/fire.jpg") or absolute https URL. */
const mediaUrl = (label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === "" || value.startsWith("https://") || value.startsWith("/"),
      `${label} must start with https:// or / for a file in public/`,
    )
    .optional()
    .or(z.literal(""));

/** A card in the hero gallery, the Fresh Fire carousel or the pastors carousel. */
export const siteMediaSchema = z
  .object({
    placement: z.enum(["HERO_GALLERY", "CAMP_CARDS", "PASTORS"]),
    title: z.string().trim().min(2, "Give the card a label").max(40),
    subtitle: z.string().trim().max(160).optional().or(z.literal("")),
    videoUrl: mediaUrl("The video URL"),
    imageUrl: mediaUrl("The image URL"),
    linkUrl: mediaUrl("The link"),
    posterUrl: mediaUrl("The poster URL"),
    sortOrder: z.coerce.number().int().min(0).max(999),
  })
  .refine((data) => data.placement !== "HERO_GALLERY" || Boolean(data.videoUrl), {
    message: "A hero card needs a video URL",
    path: ["videoUrl"],
  });

export const adminUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(80),
  email: emailSchema,
  password: z.string().min(8, "Use at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "FINANCE", "REGISTRATION", "LOGISTICS", "USHER"]),
});

/** Turn a ZodError into { field: message } for inline form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!flat[key]) flat[key] = issue.message;
  }
  return flat;
}
