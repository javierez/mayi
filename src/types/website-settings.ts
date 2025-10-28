import { z } from "zod";

// Social Links Schema
export const socialLinksSchema = z.object({
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
});

// SEO Properties Schema
export const seoPropsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.string().optional(),
  name: z.string().optional(),
  email: z
    .string()
    .email("Debe ser un email válido")
    .or(z.literal(""))
    .optional(),
  telephone: z.string().optional(),
  url: z.string().url("Debe ser una URL válida").or(z.literal("")).optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z
    .string()
    .url("Debe ser una URL válida")
    .or(z.literal(""))
    .optional(),
  ogType: z.string().optional(),
  ogUrl: z.string().url("Debe ser una URL válida").or(z.literal("")).optional(),
  ogLocale: z.string().optional(),
  ogSiteName: z.string().optional(),
});

// Hero Section Schema
export const heroPropsSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  subtitle: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundVideo: z.string().optional(),
  backgroundType: z.enum(["image", "video"]).default("image"),
  findPropertyButton: z.string().default("Explorar Propiedades"),
  contactButton: z.string().default("Contáctanos"),
});

// Featured Properties Schema
export const featuredPropsSchema = z.object({
  title: z.string().default("Propiedades Destacadas"),
  subtitle: z.string().optional(),
  maxItems: z.number().default(6),
});

// About Section Schema
export const aboutServiceSchema = z.object({
  title: z.string(),
  icon: z.string(),
});

export const aboutPropsSchema = z.object({
  title: z.string().default("Sobre Nosotros"),
  subtitle: z.string().optional(),
  content: z.string().optional(),
  content2: z.string().optional(),
  image: z.string().url("Debe ser una URL válida").or(z.literal("")).optional(),
  services: z.array(aboutServiceSchema).default([]),
  maxServicesDisplayed: z.number().default(6),
  servicesSectionTitle: z.string().default("Nuestros Servicios"),
  aboutSectionTitle: z.string().default("Nuestra Misión"),
  buttonName: z.string().default("Contacta a Nuestro Equipo"),
  showKPI: z.boolean().default(true),
  kpi1Name: z.string().optional(),
  kpi1Data: z.string().optional(),
  kpi2Name: z.string().optional(),
  kpi2Data: z.string().optional(),
  kpi3Name: z.string().optional(),
  kpi3Data: z.string().optional(),
  kpi4Name: z.string().optional(),
  kpi4Data: z.string().optional(),
});

// Properties Section Schema
export const propertiesPropsSchema = z.object({
  title: z.string().default("Nuestras Propiedades"),
  subtitle: z.string().optional(),
  itemsPerPage: z.number().min(1).max(50).default(12),
  defaultSort: z.string().default("price-desc"),
  buttonText: z.string().default("Ver Todas las Propiedades"),
});

// Testimonials Schema
export const testimonialSchema = z.object({
  testimonial_id: z.string(),
  account_id: z.string().optional(),
  name: z.string(),
  role: z.string(),
  content: z.string(),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5).default(5),
  is_verified: z.boolean().default(true),
  sort_order: z.number().default(1),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const testimonialPropsSchema = z.object({
  title: z.string().default("Lo que dicen nuestros clientes"),
  subtitle: z.string().optional(),
  itemsPerPage: z.number().default(3),
  testimonials: z.array(testimonialSchema).default([]),
});

// Contact Section Schema
export const officeSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
  }),
  phoneNumbers: z.object({
    main: z.string(),
    sales: z.string().optional(),
  }),
  emailAddresses: z.object({
    info: z.string().email("Debe ser un email válido"),
    sales: z.string().email("Debe ser un email válido").optional(),
  }),
  scheduleInfo: z.object({
    weekdays: z.string(),
    saturday: z.string(),
    sunday: z.string(),
  }),
  mapUrl: z.string().url("Debe ser una URL válida"),
  isDefault: z.boolean().optional(),
});

export const contactPropsSchema = z.object({
  title: z.string().default("Contáctanos"),
  subtitle: z.string().optional(),
  messageForm: z.boolean().default(true),
  address: z.boolean().default(true),
  phone: z.boolean().default(true),
  mail: z.boolean().default(true),
  schedule: z.boolean().default(true),
  map: z.boolean().default(true),
  offices: z.array(officeSchema).default([]),
});

// Footer Schema
export const footerLinkSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url("Debe ser una URL válida"),
});

export const footerOfficeLocationSchema = z.object({
  name: z.string(),
  address: z.array(z.string()),
  phone: z.string(),
  email: z.string().email("Debe ser un email válido"),
});

export const footerPropsSchema = z.object({
  companyName: z.string().optional(),
  description: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      instagram: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
  officeLocations: z.array(footerOfficeLocationSchema).default([]),
  quickLinksVisibility: z
    .object({
      inicio: z.boolean().default(true),
      propiedades: z.boolean().default(true),
      nosotros: z.boolean().default(true),
      reseñas: z.boolean().default(true),
      contacto: z.boolean().default(true),
      comprar: z.boolean().default(false),
      alquilar: z.boolean().default(false),
      vender: z.boolean().default(false),
    })
    .optional(),
  propertyTypesVisibility: z
    .object({
      pisos: z.boolean().default(true),
      casas: z.boolean().default(true),
      locales: z.boolean().default(true),
      solares: z.boolean().default(true),
      garajes: z.boolean().default(true),
    })
    .optional(),
  copyright: z.string().optional(),
  links: z.array(footerLinkSchema).default([]),
});

// Head/Scripts Schema
export const headPropsSchema = z.object({
  customScripts: z.string().optional(),
  googleAnalytics: z.string().optional(),
  facebookPixel: z.string().optional(),
});

// Watermark Schema
export const watermarkPropsSchema = z.object({
  enabled: z.boolean().default(false),
  position: z
    .enum(["southeast", "northeast", "southwest", "northwest", "center"])
    .default("southeast"),
  sizePercentage: z.number().min(10).max(50).default(30),
});

// Metadata Schema
export const metadataSchema = z.object({
  id: z.string().optional(),
  account_id: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  logotype: z
    .string()
    .url("Debe ser una URL válida")
    .or(z.literal(""))
    .optional(),
  mainpage: z.union([z.string(), z.record(z.unknown())]).optional(), // JSON string or parsed object
});

// Main Website Configuration Schema
export const websiteConfigurationSchema = z.object({
  socialLinks: socialLinksSchema,
  seoProps: seoPropsSchema,
  logo: z.string().url("Debe ser una URL válida").or(z.literal("")).optional(),
  favicon: z
    .string()
    .url("Debe ser una URL válida")
    .or(z.literal(""))
    .optional(),
  logotype: z
    .string()
    .url("Debe ser una URL válida")
    .or(z.literal(""))
    .optional(),
  heroProps: heroPropsSchema,
  featuredProps: featuredPropsSchema,
  aboutProps: aboutPropsSchema,
  propertiesProps: propertiesPropsSchema,
  testimonialProps: testimonialPropsSchema,
  contactProps: contactPropsSchema,
  footerProps: footerPropsSchema,
  headProps: headPropsSchema,
  watermarkProps: watermarkPropsSchema,
  metadata: metadataSchema,
  accountName: z.string().optional(),
});

// Types
export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type SeoProps = z.infer<typeof seoPropsSchema>;
export type HeroProps = z.infer<typeof heroPropsSchema>;
export type FeaturedProps = z.infer<typeof featuredPropsSchema>;
export type AboutProps = z.infer<typeof aboutPropsSchema>;
export type PropertiesProps = z.infer<typeof propertiesPropsSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type TestimonialProps = z.infer<typeof testimonialPropsSchema>;
export type Office = z.infer<typeof officeSchema>;
export type ContactProps = z.infer<typeof contactPropsSchema>;
export type FooterProps = z.infer<typeof footerPropsSchema>;
export type HeadProps = z.infer<typeof headPropsSchema>;
export type WatermarkProps = z.infer<typeof watermarkPropsSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
export type WebsiteConfigurationInput = z.infer<
  typeof websiteConfigurationSchema
>;

// Navigation Tabs Type
export interface WebsiteTab {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}
