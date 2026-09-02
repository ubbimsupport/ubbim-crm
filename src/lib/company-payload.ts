import { z } from "zod";
import type { CompanyKind, CompanyStatus } from "@/lib/types";

const emptyToNull = (value: unknown) => {
  if (value == null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  return value;
};

export const companyWriteSchema = z.object({
  company_name: z.string().trim().min(2, "Enter the company name."),
  registration_number: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  company_kind: z.enum(["vendor", "contractor"]).default("vendor"),
  company_type: z.preprocess(emptyToNull, z.string().nullable().optional()),
  category_id: z.preprocess(emptyToNull, z.uuid("Choose a valid category.").nullable().optional()),
  contact_person: z.preprocess(emptyToNull, z.string().trim().max(120).nullable().optional()),
  email: z.preprocess(emptyToNull, z.email("Enter a valid email address.").nullable().optional()),
  phone: z.preprocess(emptyToNull, z.string().trim().max(40).nullable().optional()),
  address: z.preprocess(emptyToNull, z.string().trim().max(500).nullable().optional()),
  city: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  state: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  postcode: z.preprocess(emptyToNull, z.string().trim().max(16).nullable().optional()),
  pic_id: z.preprocess(emptyToNull, z.uuid("Choose a valid PIC.").nullable().optional()),
  status: z.enum(["pending", "active", "inactive", "rejected", "expired"]).default("pending"),
  registration_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  expiry_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
  rating: z.preprocess((value) => {
    if (value == null || value === "") return null;
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : value;
  }, z.number("Rating must be a number.").min(0, "Rating must be between 0 and 5.").max(5, "Rating must be between 0 and 5.").nullable().optional()),
  remarks: z.preprocess(emptyToNull, z.string().trim().max(2000).nullable().optional()),
  specialization: z.preprocess(emptyToNull, z.string().trim().max(200).nullable().optional()),
  cidb_grade: z.preprocess(emptyToNull, z.string().trim().max(8).nullable().optional()),
  cidb_registration_number: z.preprocess(emptyToNull, z.string().trim().max(80).nullable().optional()),
  cidb_expiry_date: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

export type CompanyWriteInput = z.infer<typeof companyWriteSchema>;

export function parseCompanyWrite(input: unknown) {
  const parsed = companyWriteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the vendor details.", data: null };
  }
  return { error: null, data: parsed.data };
}

export function companyRecord(data: CompanyWriteInput) {
  return {
    company_name: data.company_name,
    registration_number: data.registration_number ?? null,
    company_kind: data.company_kind as CompanyKind,
    company_type: data.company_type ?? null,
    category_id: data.category_id ?? null,
    contact_person: data.contact_person ?? null,
    email: data.email ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    city: data.city ?? null,
    state: data.state ?? null,
    postcode: data.postcode ?? null,
    pic_id: data.pic_id ?? null,
    status: (data.status ?? "pending") as CompanyStatus,
    registration_date: data.registration_date ?? null,
    expiry_date: data.expiry_date ?? null,
    rating: data.rating ?? null,
    remarks: data.remarks ?? null,
  };
}
