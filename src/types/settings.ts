import { z } from "zod";
import type { MailSettings } from "~/components/admin/account/mail-configuration/types";

// Account Settings Types (CRM organization/tenant level)
export interface AccountSettings {
  accountId: bigint;
  name: string;
  logo?: string; // S3 URL
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  portalSettings: Record<string, unknown>;
  paymentSettings: Record<string, unknown>;
  preferences: Record<string, unknown>;
  notificationSettings?: MailSettings;
  plan: string;
  subscriptionStatus: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AccountInput {
  name: string;
  logo?: File;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// User Settings Types
export interface UserSettings {
  userId: string;
  language: "es" | "en";
  theme: "light" | "dark" | "system";
  notifications: boolean;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserInput {
  language: "es" | "en";
  theme: "light" | "dark" | "system";
  notifications: boolean;
  emailNotifications: boolean;
}

// Portal Settings Types
export interface PortalSettings {
  accountId: bigint;
  fotocasaEnabled: boolean;
  idealiistaEnabled: boolean;
  pisocomEnabled: boolean;
  autoPublish: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortalInput {
  fotocasaEnabled: boolean;
  idealiistaEnabled: boolean;
  pisocomEnabled: boolean;
  autoPublish: boolean;
}

// Payment Settings Types
export interface PaymentSettings {
  accountId: bigint;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  bizumEnabled: boolean;
  bankTransferEnabled: boolean;
  defaultPaymentMethod: "stripe" | "paypal" | "bizum" | "bank_transfer";
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentInput {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  bizumEnabled: boolean;
  bankTransferEnabled: boolean;
  defaultPaymentMethod: "stripe" | "paypal" | "bizum" | "bank_transfer";
}

// Zod Validation Schemas
export const accountSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Nombre requerido")
    .max(255, "Nombre demasiado largo"),
  address: z.string().max(500, "Dirección demasiado larga").optional(),
  phone: z.string().max(20, "Teléfono demasiado largo").optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
});

export const userSettingsSchema = z.object({
  language: z.enum(["es", "en"], {
    required_error: "Idioma requerido",
  }),
  theme: z.enum(["light", "dark", "system"], {
    required_error: "Tema requerido",
  }),
  notifications: z.boolean(),
  emailNotifications: z.boolean(),
});

export const portalSettingsSchema = z.object({
  fotocasaEnabled: z.boolean(),
  idealiistaEnabled: z.boolean(),
  pisocomEnabled: z.boolean(),
  autoPublish: z.boolean(),
});

export const paymentSettingsSchema = z.object({
  stripeEnabled: z.boolean(),
  paypalEnabled: z.boolean(),
  bizumEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  defaultPaymentMethod: z.enum(["stripe", "paypal", "bizum", "bank_transfer"], {
    required_error: "Método de pago por defecto requerido",
  }),
});

// Logo upload specific schema
export const logoUploadSchema = z.object({
  file: z.instanceof(File, { message: "Archivo requerido" }),
  accountId: z.string().min(1, "ID de cuenta requerido"),
});

// Settings tab types for navigation
export type SettingsTab = "account" | "user" | "portals" | "payments";

export interface SettingsTabConfig {
  id: SettingsTab;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// API Response types
export interface SettingsApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type AccountSettingsResponse = SettingsApiResponse<AccountSettings>;
export type UserSettingsResponse = SettingsApiResponse<UserSettings>;
export type PortalSettingsResponse = SettingsApiResponse<PortalSettings>;
export type PaymentSettingsResponse = SettingsApiResponse<PaymentSettings>;
