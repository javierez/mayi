import { z } from "zod";

// Portal configuration data structure
export interface PortalConfigurationData {
  fotocasa?: {
    enabled: boolean;
    apiKey?: string;
    publisherId?: string; // Agency's unique publisher ID for fetching leads
    customSettings?: Record<string, unknown>;
  };
  idealista?: {
    enabled: boolean;
    apiKey?: string;
    maxSlots?: number; // Max listings that can be published to Idealista (null = unlimited)
    customSettings?: Record<string, unknown>;
  };
  general: {
    watermarkEnabled: boolean;
    watermarkPosition?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
  };
}

// Input type for forms
export interface PortalConfigurationInput {
  fotocasa?: {
    enabled: boolean;
    apiKey?: string;
    publisherId?: string; // Agency's unique publisher ID for fetching leads
  };
  idealista?: {
    enabled: boolean;
    apiKey?: string;
    maxSlots?: number; // Max listings that can be published to Idealista
  };
  general: {
    watermarkEnabled: boolean;
    watermarkPosition?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "center";
  };
}

// Zod validation schema
export const portalConfigurationSchema = z.object({
  fotocasa: z
    .object({
      enabled: z.boolean(),
      apiKey: z.string().optional(),
      publisherId: z.string().optional(), // Agency's unique publisher ID for fetching leads
    })
    .optional(),
  idealista: z
    .object({
      enabled: z.boolean(),
      apiKey: z.string().optional(),
      maxSlots: z.number().int().min(1).optional(),
    })
    .optional(),
  general: z.object({
    watermarkEnabled: z.boolean(),
    watermarkPosition: z
      .enum(["top-left", "top-right", "bottom-left", "bottom-right", "center"])
      .optional(),
  }),
});

// API Response type
export interface PortalConfigurationResponse {
  success: boolean;
  data?: PortalConfigurationData;
  error?: string;
}

// Tab configuration type
export interface PortalTab {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}
