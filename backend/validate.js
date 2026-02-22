const { z } = require("zod");

const clean = (value) => String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim();

const emailSchema = z
  .string({ required_error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(150, "Email is too long.");

const phoneSchema = z
  .string({ required_error: "Phone is required." })
  .trim()
  .min(1, "Phone is required.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 6 && digits.length <= 15;
  }, "Enter a valid phone number.")
  .max(30, "Phone is too long.");

const nameSchema = z
  .string({ required_error: "Name is required." })
  .trim()
  .min(1, "Name is required.")
  .max(100, "Name is too long.");

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date.");

const bookingSchema = z.object({
  from: z.string().trim().min(1, "From is required.").max(120, "From is too long."),
  to: z.string().trim().min(1, "To is required.").max(120, "To is too long."),
  departure_date: dateSchema,
  departure_time: z.string().trim().min(1, "Departure time is required.").max(20),
  return_date: z.string().trim().optional().or(z.literal("")),
  return_time: z.string().trim().optional().or(z.literal("")),
  passengers: z.coerce.number().int().min(1).max(19),
  contact_email: emailSchema,
  contact_phone: phoneSchema,
  notes: z.string().trim().max(1000, "Notes too long.").optional().or(z.literal("")),
  source_page: z.string().trim().max(200).optional().or(z.literal("")),
  captcha_verified: z.any().optional(),
  timestamp_iso: z.any().optional(),
  captcha_answer: z.any().optional()
});

const contactSchema = z.object({
  contact_name: nameSchema,
  contact_email: emailSchema,
  contact_phone: phoneSchema,
  notes: z.string().trim().max(1000, "Notes too long.").optional().or(z.literal("")),
  source_page: z.string().trim().max(200).optional().or(z.literal("")),
  captcha_verified: z.any().optional(),
  timestamp_iso: z.any().optional(),
  captcha_answer: z.any().optional()
});

const updateSubmissionSchema = z
  .object({
    status: z.enum(["new", "contacted", "qualified", "closed", "spam"]).optional(),
    admin_notes: z.string().max(4000, "Admin notes too long.").optional()
  })
  .refine((payload) => typeof payload.status === "string" || typeof payload.admin_notes === "string", {
    message: "No updatable fields provided."
  });

function zodErrorsToFieldMap(error) {
  const out = {};
  for (const issue of error.issues || []) {
    const key = String(issue.path?.[0] || "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function parseBookingSubmission(body) {
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, errors: zodErrorsToFieldMap(parsed.error) };
  }

  const data = parsed.data;
  return {
    ok: true,
    data: {
      source: "booking",
      name: clean(data.contact_email),
      email: clean(data.contact_email).toLowerCase(),
      phone: clean(data.contact_phone),
      route_from: clean(data.from),
      route_to: clean(data.to),
      departure_date: clean(data.departure_date),
      return_date: clean(data.return_date),
      passengers: Number(data.passengers),
      notes: clean(data.notes),
      payload_json: {
        ...data,
        contact_email: clean(data.contact_email).toLowerCase(),
        contact_phone: clean(data.contact_phone)
      }
    }
  };
}

function parseContactSubmission(body) {
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, errors: zodErrorsToFieldMap(parsed.error) };
  }

  const data = parsed.data;
  return {
    ok: true,
    data: {
      source: "contact",
      name: clean(data.contact_name),
      email: clean(data.contact_email).toLowerCase(),
      phone: clean(data.contact_phone),
      route_from: null,
      route_to: null,
      departure_date: null,
      return_date: null,
      passengers: null,
      notes: clean(data.notes),
      payload_json: {
        ...data,
        contact_name: clean(data.contact_name),
        contact_email: clean(data.contact_email).toLowerCase(),
        contact_phone: clean(data.contact_phone)
      }
    }
  };
}

function parseAdminUpdate(body) {
  const parsed = updateSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, errors: zodErrorsToFieldMap(parsed.error) };
  }

  const data = parsed.data;
  return {
    ok: true,
    data: {
      ...(typeof data.status === "string" ? { status: data.status } : {}),
      ...(typeof data.admin_notes === "string" ? { admin_notes: data.admin_notes.trim() } : {})
    }
  };
}

module.exports = {
  parseBookingSubmission,
  parseContactSubmission,
  parseAdminUpdate
};
