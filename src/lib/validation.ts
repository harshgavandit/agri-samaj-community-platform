import { z } from "zod";

export const text = (max = 250) => z.string().trim().min(1).max(max);
export const optionalText = (max = 250) => z.string().trim().max(max).nullish();
export const email = z.string().trim().toLowerCase().email().max(254);
export const phone = z
  .string()
  .trim()
  .regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number");
const optionalEmail = z.union([email, z.literal(""), z.null()]).optional();
const optionalPhone = z.union([phone, z.literal(""), z.null()]).optional();
const number = (max = 1_000_000) =>
  z.preprocess(
    (v) =>
      v === "" || v == null ? undefined : typeof v === "string" ? Number(v) : v,
    z.number().finite().nonnegative().max(max).optional(),
  );
export const integer = (max = 1_000_000) =>
  number(max).refine(
    (v) => v == null || Number.isInteger(v),
    "Must be a whole number",
  );
export const fileUrl = z
  .string()
  .regex(
    /^\/api\/files\/[a-f0-9-]{36}$/,
    "Choose a file uploaded to your account",
  );
const optionalFile = z.union([fileUrl, z.literal(""), z.null()]).optional();
export const website = z
  .union([
    z
      .string()
      .trim()
      .url()
      .max(500)
      .refine((v) => /^https?:\/\//i.test(v), "Use an http or https URL"),
    z.literal(""),
    z.null(),
  ])
  .optional();
export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(72),
});
export const registerSchema = z.object({
  name: text(120),
  email,
  password: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(72)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password must be at most 72 bytes",
    ),
  phone: optionalPhone,
});
export const contactSchema = z.object({
  name: text(120),
  email,
  phone: optionalPhone,
  subject: optionalText(200),
  message: text(5000),
});

export const businessSchema = z
  .object({
    id: optionalText(100),
    refNumber: optionalText(100),
    isDraft: z.boolean().default(false),
    hasFactory: z.boolean().optional(),
    ownerName: optionalText(120),
    ownerPhone: optionalPhone,
    ownerEmail: optionalEmail,
    ownerEducationSchool: optionalText(),
    ownerEducationVocational: optionalText(),
    businessName: optionalText(),
    brandName: optionalText(),
    categoryId: text(100),
    subCategory: optionalText(),
    productsServices: optionalText(5000),
    description: optionalText(10000),
    establishedYear: integer(new Date().getFullYear()).refine(
      (v) => v == null || v >= 1800,
      "Enter a year from 1800 to the current year",
    ),
    businessClassification: z
      .enum(["MANUFACTURER", "TRADER", "CONTRACTOR", "PROFESSIONAL", "OTHER"])
      .default("TRADER"),
    ownershipType: z
      .enum(["PROPRIETORSHIP", "PARTNERSHIP", "PVT_LTD", "OTHER"])
      .default("PROPRIETORSHIP"),
    workNature: z
      .enum(["FULL_TIME", "PART_TIME", "SEASONAL", "OTHER"])
      .default("FULL_TIME"),
    startedBy: z.enum(["SELF", "FAMILY", "ANCESTRAL", "OTHER"]).default("SELF"),
    officeAddress: optionalText(1000),
    officeCity: optionalText(),
    officeTaluka: optionalText(),
    officeDistrict: optionalText(),
    officePincode: z
      .union([z.string().regex(/^[1-9]\d{5}$/), z.literal("")])
      .optional(),
    officePhone: optionalPhone,
    factoryAddress: optionalText(1000),
    factoryCity: optionalText(),
    factoryTaluka: optionalText(),
    factoryDistrict: optionalText(),
    factoryPincode: z
      .union([z.string().regex(/^[1-9]\d{5}$/), z.literal("")])
      .nullish(),
    isAddressPublic: z.boolean().default(true),
    premisesOwnership: z.enum(["OWNED", "RENTED", "OTHER"]).default("OWNED"),
    areaSqm: number(),
    employeeCountFemale: integer(),
    employeeCountMale: integer(),
    employeeCountTotal: integer(),
    website,
    email: optionalEmail,
    phone: optionalPhone,
    logoUrl: optionalFile,
    documentUrl: optionalFile,
    termsAccepted: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.isDraft) return;
    for (const key of [
      "ownerName",
      "ownerPhone",
      "businessName",
      "productsServices",
      "officeAddress",
      "officeCity",
      "officeTaluka",
      "officeDistrict",
      "officePincode",
    ] as const) {
      if (!data[key])
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Required for submission",
        });
    }
    if (!data.termsAccepted)
      ctx.addIssue({
        code: "custom",
        path: ["termsAccepted"],
        message: "Please accept the terms",
      });
  });

export const bookingSchema = z.object({
  packageId: text(100),
  businessProfileId: optionalText(100),
  advertiserName: text(120),
  businessName: optionalText(),
  contactPerson: optionalText(120),
  phone,
  email,
  address: optionalText(1000),
  adTextContent: text(5000),
  artworkUrl: optionalFile,
  paymentMethod: z
    .enum(["UPI", "NEFT_RTGS", "CHEQUE_DRAFT", "CASH"])
    .default("NEFT_RTGS"),
  paymentReference: optionalText(150),
});
export const categorySchema = z.object({
  id: optionalText(100),
  slug: text(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nameMr: text(),
  nameEn: text(),
  descriptionMr: optionalText(2000),
  descriptionEn: optionalText(2000),
  icon: optionalText(80),
  order: integer(10000),
  isActive: z.boolean().default(true),
});
export const announcementSchema = z.object({
  id: optionalText(100),
  titleMr: text(),
  titleEn: text(),
  slug: optionalText(150),
  contentMr: text(15000),
  contentEn: optionalText(15000),
  category: z
    .enum(["INITIATIVE", "EVENT", "NEWS", "MEETING"])
    .default("INITIATIVE"),
  eventDate: z
    .union([
      z.string().refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date"),
      z.literal(""),
    ])
    .nullish(),
  location: optionalText(500),
  isPublished: z.boolean().default(true),
});
export const adStatusSchema = z.object({
  id: text(100),
  paymentStatus: z
    .enum(["PENDING", "VERIFIED", "FAILED", "REFUNDED"])
    .optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"]).optional(),
  adminRemarks: optionalText(2000),
});
export const inquirySchema = z.object({
  id: text(100),
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).optional(),
  adminNotes: optionalText(2000),
});
export const statusSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED", "REVISION_REQUIRED", "PENDING"]),
    rejectionReason: optionalText(2000),
    adminNotes: optionalText(2000),
  })
  .refine(
    (v) =>
      !["REJECTED", "REVISION_REQUIRED"].includes(v.status) ||
      !!v.rejectionReason,
    "Provide a reason for rejection or revision",
  );
export const censusSchema = z
  .object({
    enumeratorNo: text(100),
    surveyorName: text(120),
    divisionName: text(),
    taluka: text(),
    district: text(),
    pincode: z.string().regex(/^[1-9]\d{5}$/),
    totalHouses: integer(),
    agriHouses: integer(),
    questionnairesReceivedFrom: integer(),
    questionnairesReceivedTo: integer(),
    questionnairesUsed: integer(),
    questionnairesBlank: integer(),
    questionnairesDamaged: integer(),
    notes: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (!v.totalHouses || v.agriHouses == null || v.agriHouses > v.totalHouses)
      ctx.addIssue({
        code: "custom",
        message:
          "Household counts must be valid and Agri houses cannot exceed total houses",
      });
    if (
      v.questionnairesReceivedFrom != null &&
      v.questionnairesReceivedTo != null
    ) {
      const capacity =
        v.questionnairesReceivedTo - v.questionnairesReceivedFrom + 1;
      if (
        capacity < 1 ||
        (v.questionnairesUsed || 0) +
          (v.questionnairesBlank || 0) +
          (v.questionnairesDamaged || 0) >
          capacity
      )
        ctx.addIssue({
          code: "custom",
          message: "Questionnaire counts exceed the received range",
        });
    }
  });
