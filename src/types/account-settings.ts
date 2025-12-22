import { z } from "zod";

// Account configuration schema
export const accountConfigurationSchema = z.object({
  // Basic Information
  name: z.string().min(1, "El nombre es requerido"),
  shortName: z.string().optional(),
  legalName: z.string().optional(),
  logo: z.string().optional(),

  // Contact Information
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),

  // Legal Information
  taxId: z.string().optional(),
  collegiateNumber: z.string().optional(),
  registryDetails: z.string().optional(),
  legalEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  jurisdiction: z.string().optional(),
  privacyEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  dpoEmail: z.string().email("Email inválido").optional().or(z.literal("")),

  // Signature Configuration
  accountType: z.enum(["company", "person"]).optional(),
  defaultSigningAgentId: z.string().optional(),
  signatureUrl: z.string().optional(),

  // Settings
  preferences: z.record(z.any()).optional(),
  terms: z
    .object({
      commission: z.number().min(0).max(100).optional(),
      min_commission: z.number().min(0).optional(),
      duration: z.number().min(1).optional(),
      exclusivity: z.boolean().optional(),
      communications: z.boolean().optional(),
      allowSignage: z.boolean().optional(),
      allowVisits: z.boolean().optional(),
    })
    .optional(),
});

export type AccountConfigurationInput = z.infer<
  typeof accountConfigurationSchema
>;
