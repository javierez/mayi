import {
  bigint,
  varchar,
  timestamp,
  boolean,
  pgTable,
  jsonb,
  text,
  decimal,
  smallint,
  integer,
  time,
  bigserial,
} from "drizzle-orm/pg-core";

// Accounts table (CRM organization/tenant - top level entity)
export const accounts = pgTable("accounts", {
  accountId: bigserial("account_id", { mode: "bigint" })
    .primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shortName: varchar("short_name", { length: 50 }), // Abbreviated company names
  legalName: varchar("legal_name", { length: 255 }), // Full legal company name
  logo: varchar("logo", { length: 2048 }), // S3 URL for organization logo
  address: varchar("address", { length: 500 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  // Account type - company or person
  accountType: varchar("account_type", { length: 20 }).default("company"), // company or person
  // Legal information fields
  taxId: varchar("tax_id", { length: 50 }), // Tax identification number (CIF/NIF)
  collegiateNumber: varchar("collegiate_number", { length: 50 }), // Professional collegiate number (API registration)
  registryDetails: text("registry_details"), // Commercial registry information
  legalEmail: varchar("legal_email", { length: 255 }), // Legal contact email address
  jurisdiction: varchar("jurisdiction", { length: 255 }), // Legal jurisdiction and applicable courts
  privacyEmail: varchar("privacy_email", { length: 255 }), // Privacy/GDPR contact email address
  dpoEmail: varchar("dpo_email", { length: 255 }), // Data Protection Officer email address
  // Settings JSON fields for flexible configuration
  portalSettings: jsonb("portal_settings").default({}), // Fotocasa, Idealista, etc. (includes API keys)
  paymentSettings: jsonb("payment_settings").default({}), // Stripe, PayPal, etc.
  preferences: jsonb("preferences").default({}), // General account preferences
  terms: jsonb("terms").default({}), // Terms and conditions configuration
  onboardingData: jsonb("onboarding_data").default({}), // Onboarding form responses: { completed, previousCrm, referralSource, teamSize, businessFocus, monthlyListings, challenge, email, website, domains, portals, notes, completedAt }
  taskPreferences: jsonb("task_preferences").default({
    property: {
      uploadPhotos: { enabled: true, dueDays: 7 },
      completeInfo: { enabled: true, dueDays: 7 },
      scheduleVisit: { enabled: true, dueDays: 10 },
      pickupKeys: { enabled: true, dueDays: 10 },
      valuation: { enabled: true, dueDays: 10 },
      createHojaEncargo: { enabled: true, dueDays: 12 },
      signHojaEncargo: { enabled: true, dueDays: 14 },
      generateCartel: { enabled: true, dueDays: 16 },
    },
  }), // Task creation preferences for automatic tasks (property listing tasks)
  // Subscription/billing info
  plan: varchar("plan", { length: 50 }).default("basic"), // basic, pro, enterprise
  subscriptionType: varchar("subscription_type", { length: 100 }), // More detailed subscription type
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default(
    "active",
  ),
  subscriptionStartDate: timestamp("subscription_start_date"), // Subscription start date
  subscriptionEndDate: timestamp("subscription_end_date"), // Subscription end date
  status: varchar("status", { length: 20 }).default("active"), // active/inactive/suspended
  // Image AI Token System
  imageTokenBalance: integer("image_token_balance").default(0).notNull(), // Current token balance for AI image operations
  imageTokensUsed: integer("image_tokens_used").default(0).notNull(), // Lifetime token usage tracking
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Offices table (for accounts with multiple offices)
export const offices = pgTable("offices", {
  officeId: bigserial("office_id", { mode: "bigint" })
    .primaryKey(),
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  name: varchar("name", { length: 100 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Users table (Enhanced for BetterAuth compatibility)
export const users = pgTable("users", {
  // BetterAuth required fields (with exact names it expects)
  id: varchar("id", { length: 36 }).primaryKey(), // BetterAuth expects string id
  name: varchar("name", { length: 200 }).notNull(), // BetterAuth expects 'name' field
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: boolean("email_verified").default(false),
  emailVerifiedAt: timestamp("email_verified_at"),
  image: varchar("image", { length: 255 }), // BetterAuth expects 'image' not 'profileImageUrl'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  password: varchar("password", { length: 255 }),

  // Your additional fields
  accountId: bigint("account_id", { mode: "bigint" }), // FK → accounts.account_id (nullable for social login)
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  preferences: jsonb("preferences").default({}),
  lastLogin: timestamp("last_login"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
});

// Roles table
export const roles = pgTable("roles", {
  roleId: bigserial("role_id", { mode: "bigint" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }),
  permissions: jsonb("permissions").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// UserRoles junction table (Many-to-Many relationship between users and roles)
export const userRoles = pgTable("user_roles", {
  userRoleId: bigserial("user_role_id", { mode: "bigint" })
    .primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (BetterAuth compatible)
  roleId: bigint("role_id", { mode: "bigint" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// BetterAuth tables for authentication
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: varchar("user_id", { length: 36 }).notNull(), // Changed to varchar to match users.id
});

// OAuth provider accounts linked to users
export const authAccounts = pgTable("account", {
  id: varchar("id", { length: 36 }).primaryKey(),
  accountId: text("account_id").notNull(), // OAuth provider account ID
  providerId: text("provider_id").notNull(), // e.g., "google", "apple", "linkedin"
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"), // For email/password auth
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password Reset Tokens (SMS-based verification)
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  resetCode: varchar("reset_code", { length: 255 }).notNull(), // Hashed 6-digit code
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"), // NULL until used, prevents reuse
  ipAddress: text("ip_address"), // Security audit trail
  userAgent: text("user_agent"), // Security audit trail
});

// Account-Level Two-Factor Authentication Settings
export const accountTwoFactorSettings = pgTable("account_two_factor_settings", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  accountId: bigint("account_id", { mode: "bigint" }).notNull().unique(), // FK → accounts.account_id (one per account)
  isRequired: boolean("is_required").default(false).notNull(), // Whether 2FA is mandatory for all employees (users cannot opt out)
  enabledBy: varchar("enabled_by", { length: 36 }), // FK → users.id (admin who set the policy)
  enabledAt: timestamp("enabled_at"), // When 2FA was made mandatory
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Level Two-Factor Authentication (SMS-based verification)
export const twoFactor = pgTable("two_factor", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().unique(), // FK → users.id (one per user)
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  isEnabled: boolean("is_enabled").default(true).notNull(), // Whether user has 2FA enabled
  lastCode: varchar("last_code", { length: 255 }), // Hashed last SMS code sent
  lastCodeSentAt: timestamp("last_code_sent_at"), // When the last code was sent
  lastCodeExpiresAt: timestamp("last_code_expires_at"), // When the last code expires
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Locations table
export const locations = pgTable("locations", {
  neighborhoodId: bigserial("neighborhood_id", { mode: "bigint" })
    .primaryKey(),
  city: varchar("city", { length: 100 }).notNull(),
  province: varchar("province", { length: 100 }).notNull(),
  municipality: varchar("municipality", { length: 100 }).notNull(),
  neighborhood: varchar("neighborhood", { length: 100 }).notNull(),
  neighborhoodClean: varchar("neighborhood_clean", { length: 100 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Properties table
export const properties = pgTable("properties", {
  // Primary Key
  propertyId: bigserial("property_id", { mode: "bigint" })
    .primaryKey(),

  // Account for multi-tenant security
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id

  // Basic Information
  referenceNumber: varchar("reference_number", { length: 32 }),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  propertyType: varchar("property_type", { length: 20 }).default("piso"), // 'piso' | 'casa' | 'local' | 'garaje' | 'solar'
  propertySubtype: varchar("property_subtype", { length: 50 }), // For piso: 'Piso' | 'Apartment' | 'Ground floor' // For casa: 'Casa' // For local: 'Otros' | 'Offices' // For garaje: 'Individual' // For solar: 'Suelo residencial'
  formPosition: integer("form_position").notNull().default(1),

  // Property Specifications
  bedrooms: smallint("bedrooms"),
  bathrooms: decimal("bathrooms", { precision: 3, scale: 1 }),
  squareMeter: integer("square_meter"),
  yearBuilt: smallint("year_built"),
  cadastralReference: varchar("cadastral_reference", { length: 255 }),
  builtSurfaceArea: decimal("built_surface_area", { precision: 10, scale: 2 }),
  conservationStatus: smallint("conservation_status").default(1), // 1='Bueno' | 2='Muy bueno' | 3='Como nuevo' | 4='A reformar' | 6='Reformado'

  // Location Information
  street: varchar("street", { length: 255 }),
  addressDetails: varchar("address_details", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  neighborhoodId: bigint("neighborhood_id", { mode: "bigint" }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),

  // Energy and Heating
  energyCertification: text("energy_certification"),
  energyCertificateStatus: varchar("energy_certificate_status", { length: 20 }), // 'disponible' | 'en_tramite' | 'pendiente' | 'no_indicado' | 'exento'
  energyConsumptionScale: varchar("energy_consumption_scale", { length: 2 }), // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' (A=most efficient, G=least efficient)
  energyConsumptionValue: decimal("energy_consumption_value", {
    precision: 6,
    scale: 2,
  }), // kWh/m² año
  emissionsScale: varchar("emissions_scale", { length: 2 }), // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' (A=lowest emissions, G=highest emissions)
  emissionsValue: decimal("emissions_value", { precision: 6, scale: 2 }), // kg CO2/m² año
  hasHeating: boolean("has_heating").default(false),
  heatingType: varchar("heating_type", { length: 50 }), // 'Gas natural' | 'Calefacción central' | 'Eléctrica' | 'gas' | 'induccion' | 'vitroceramica' | 'carbon' | 'electrico' | 'mixto'

  // Basic Amenities
  hasElevator: boolean("has_elevator"),
  hasGarage: boolean("has_garage").default(false),
  hasStorageRoom: boolean("has_storage_room").default(false),

  // System Fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),

  // Property Features
  garageType: varchar("garage_type", { length: 50 }),
  garageSpaces: smallint("garage_spaces"),
  garageInBuilding: boolean("garage_in_building"),
  elevatorToGarage: boolean("elevator_to_garage"),
  garageNumber: varchar("garage_number", { length: 20 }),

  // Community and Recreational Amenities
  gym: boolean("gym").default(false),
  sportsArea: boolean("sports_area").default(false),
  childrenArea: boolean("children_area").default(false),
  suiteBathroom: boolean("suite_bathroom").default(false),
  nearbyPublicTransport: boolean("nearby_public_transport").default(false),
  communityPool: boolean("community_pool").default(false),
  privatePool: boolean("private_pool").default(false),
  tennisCourt: boolean("tennis_court").default(false),
  communityArea: boolean("community_area").default(false),

  // Property Characteristics
  disabledAccessible: boolean("disabled_accessible"),
  vpo: boolean("vpo"),
  videoIntercom: boolean("video_intercom"),
  conciergeService: boolean("concierge_service"),
  securityGuard: boolean("security_guard"),
  satelliteDish: boolean("satellite_dish"),
  doubleGlazing: boolean("double_glazing"),
  alarm: boolean("alarm"),
  securityDoor: boolean("security_door"),

  // Property Condition
  brandNew: boolean("brand_new"),
  newConstruction: boolean("new_construction"),
  underConstruction: boolean("under_construction"),
  needsRenovation: boolean("needs_renovation"),
  lastRenovationYear: smallint("last_renovation_year"),

  // Kitchen Features
  kitchenType: varchar("kitchen_type", { length: 50 }), // 'gas' | 'induccion' | 'vitroceramica' | 'carbon' | 'electrico' | 'mixto'
  hotWaterType: varchar("hot_water_type", { length: 50 }),
  openKitchen: boolean("open_kitchen"),
  frenchKitchen: boolean("french_kitchen"),
  furnishedKitchen: boolean("furnished_kitchen"),
  pantry: boolean("pantry"),

  // Storage and Additional Spaces
  storageRoomSize: integer("storage_room_size"),
  storageRoomNumber: varchar("storage_room_number", { length: 20 }),
  terrace: boolean("terrace"),
  terraceSize: integer("terrace_size"),
  wineCellar: boolean("wine_cellar"),
  wineCellarSize: integer("wine_cellar_size"),
  livingRoomSize: integer("living_room_size"),
  balconyCount: smallint("balcony_count"),
  galleryCount: smallint("gallery_count"),
  buildingFloors: smallint("building_floors"),

  // Interior Features
  builtInWardrobes: boolean("built_in_wardrobes").default(false),
  mainFloorType: varchar("main_floor_type", { length: 50 }), // Floor material type (parquet, ceramic, marble, etc.)
  shutterType: varchar("shutter_type", { length: 50 }),
  carpentryType: varchar("carpentry_type", { length: 50 }),
  orientation: varchar("orientation", { length: 50 }), // 'norte' | 'noreste' | 'este' | 'sureste' | 'sur' | 'suroeste' | 'oeste' | 'noroeste'
  airConditioningType: varchar("air_conditioning_type", { length: 50 }),
  windowType: varchar("window_type", { length: 50 }),

  // Views and Location Features
  exterior: boolean("exterior"),
  bright: boolean("bright"),
  views: boolean("views"),
  mountainViews: boolean("mountain_views"),
  seaViews: boolean("sea_views"),
  beachfront: boolean("beachfront"),

  // Luxury Amenities
  jacuzzi: boolean("jacuzzi"),
  hydromassage: boolean("hydromassage"),
  garden: boolean("garden"),
  pool: boolean("pool"),
  homeAutomation: boolean("home_automation"),
  musicSystem: boolean("music_system"),
  laundryRoom: boolean("laundry_room"),
  coveredClothesline: boolean("covered_clothesline"),
  fireplace: boolean("fireplace"),
  sauna: boolean("sauna"),
  loadingArea: boolean("loading_area"),
  patio: boolean("patio"),
  allowedUse: smallint("allowed_use"), // Allowed use for solar/land properties (1-9 enum)
  isDiafano: boolean("is_diafano"), // Only for 'local' property type - open-plan/open-space commercial
  hasEscaparate: boolean("has_escaparate"), // Only for 'local' property type - has shop window/storefront
  streetType: varchar("street_type", { length: 50 }), // Only for 'local' - traffic intensity: muy_transitada, transitada, moderada, poco_transitada

  // Finca (estate/land) - specific to 'casa' property type
  finca: boolean("finca").default(false), // Indicates if the casa has an estate/land
  superficieFinca: decimal("superficie_finca", { precision: 10, scale: 2 }), // Surface area of the estate in m²

  // Utilities and Installations
  electricityType: varchar("electricity_type", { length: 50 }), // 'monofasica' | 'trifasica' | 'mixta' | 'no_disponible'
  electricityStatus: varchar("electricity_status", { length: 50 }), // 'nuevo' | 'buen_estado' | 'funcional' | 'necesita_actualizacion' | 'necesita_reparacion' | 'no_disponible'
  plumbingType: varchar("plumbing_type", { length: 50 }), // 'cobre' | 'pvc' | 'multicapa' | 'galvanizado' | 'mixto' | 'no_disponible'
  plumbingStatus: varchar("plumbing_status", { length: 50 }), // 'nuevo' | 'buen_estado' | 'funcional' | 'necesita_actualizacion' | 'tiene_fugas' | 'necesita_reparacion' | 'no_disponible'

  // Property Expenses - Taxes & Fees
  ibi: decimal("ibi", { precision: 10, scale: 2 }), // IBI property tax (€/year)
  garbageTax: decimal("garbage_tax", { precision: 10, scale: 2 }), // Garbage collection tax (€/year)
  vadoPermanente: decimal("vado_permanente", { precision: 10, scale: 2 }), // Permanent driveway permit (€/year)

  // Property Expenses - Community
  communityFees: decimal("community_fees", { precision: 10, scale: 2 }), // HOA/community fees (€/month)
  derrama: decimal("derrama", { precision: 10, scale: 2 }), // Special community assessment (€)

  // Property Expenses - Utility Estimates
  electricityEstimate: decimal("electricity_estimate", { precision: 10, scale: 2 }), // Estimated electricity (€/month)
  gasEstimate: decimal("gas_estimate", { precision: 10, scale: 2 }), // Estimated gas (€/month)
  waterEstimate: decimal("water_estimate", { precision: 10, scale: 2 }), // Estimated water (€/month)
  centralHeatingFee: decimal("central_heating_fee", { precision: 10, scale: 2 }), // Central heating fee (€/month)
  internetEstimate: decimal("internet_estimate", { precision: 10, scale: 2 }), // Estimated internet (€/month)

  // Property Expenses - Insurance
  homeInsurance: decimal("home_insurance", { precision: 10, scale: 2 }), // Home insurance (€/year)

  // Data Processing Fields
  scrapedText: varchar("scraped_text", { length: 1024 }), // S3 path for property scraped text data
});

export const propertyImages = pgTable("property_images", {
  propertyImageId: bigserial("property_image_id", { mode: "bigint" })
    .primaryKey(),
  propertyId: bigint("property_id", { mode: "bigint" }).notNull(),
  referenceNumber: varchar("reference_number", { length: 32 }).notNull(),
  imageUrl: varchar("image_url", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  imageKey: varchar("image_key", { length: 2048 }).notNull(),
  imageTag: varchar("image_tag", { length: 255 }),
  s3key: varchar("s3key", { length: 2048 }).notNull(),
  imageOrder: integer("image_order").default(0).notNull(),
  originImageId: bigint("origin_image_id", { mode: "bigint" }),
});

export const listings = pgTable("listings", {
  // Primary Key
  listingId: bigserial("listing_id", { mode: "bigint" })
    .primaryKey(),

  // Account for multi-tenant security
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id

  // Basic Information
  propertyId: bigint("property_id", { mode: "bigint" }).notNull(), // FK → properties.property_id
  agentId: varchar("agent_id", { length: 36 }).notNull(), // FK → users.user_id (agent) - Changed to varchar to match users.id
  listingType: varchar("listing_type", { length: 20 }).notNull(), // 'Sale' | 'Rent' | 'Sold' | 'Transfer' | 'RentWithOption' | 'RoomSharing'
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'En Venta' | 'En Alquiler' | 'Vendido' | 'Alquilado' | 'Descartado' | 'Draft'
  prospectStatus: varchar("prospect_status", { length: 50 }), // Prospect workflow status: 'En búsqueda' | 'En preparación' | 'Finalizado' | 'Archivado'

  // Listing-specific descriptions
  description: text("description"), // Full listing description (can differ from property description)
  shortDescription: varchar("short_description", { length: 500 }), // Brief summary for listing cards/previews

  // Listing Features
  isFurnished: boolean("is_furnished"),
  furnitureQuality: varchar("furniture_quality", { length: 50 }), // 'basic' | 'standard' | 'high' | 'luxury' (Básico | Estándar | Alta | Lujo)
  optionalGarage: boolean("optional_garage"),
  optionalGaragePrice: decimal("optional_garage_price", {
    precision: 12,
    scale: 2,
  }),
  optionalStorageRoom: boolean("optional_storage_room")
    .notNull()
    .default(false),
  optionalStorageRoomPrice: decimal("optional_storage_room_price", {
    precision: 12,
    scale: 2,
  }),
  hasKeys: boolean("has_keys").notNull().default(false),
  encargo: boolean("encargo").notNull().default(false),
  studentFriendly: boolean("student_friendly"),
  petsAllowed: boolean("pets_allowed"),
  appliancesIncluded: boolean("appliances_included"),

  // Appliances and Amenities
  internet: boolean("internet").default(false),
  oven: boolean("oven").default(false),
  microwave: boolean("microwave").default(false),
  washingMachine: boolean("washing_machine").default(false),
  secadora: boolean("secadora").default(false),
  fridge: boolean("fridge").default(false),
  tv: boolean("tv").default(false),
  stoneware: boolean("stoneware").default(false),

  // Listing Status and Visibility
  isFeatured: boolean("is_featured").default(false),
  isBankOwned: boolean("is_bank_owned").default(false),
  isOpportunity: boolean("is_opportunity").default(false), // Mark listing as a special opportunity/deal
  isActive: boolean("is_active").default(true),
  publishToWebsite: boolean("publish_to_website").default(false), // Controls whether listing appears on company website
  enEscaparate: boolean("en_escaparate").default(false).notNull(), // Property poster/sign displayed in office shop window
  hasCartel: boolean("has_cartel").default(false).notNull(), // Whether a cartel (property poster/sign) has been designed
  visibilityMode: smallint("visibility_mode").default(1), // 1=Exact location | 2=Street level | 3=Zone/neighborhood level

  // Analytics
  viewCount: integer("view_count").default(0),
  inquiryCount: integer("inquiry_count").default(0),

  // Portal Publication Fields (Spanish real estate portals)
  fotocasa: boolean("fotocasa").default(false), // Fotocasa.es publication status
  idealista: boolean("idealista").default(false), // Idealista.com publication status
  habitaclia: boolean("habitaclia").default(false), // Habitaclia.com publication status
  pisoscom: boolean("pisoscom").default(false), // Pisos.com publication status
  yaencontre: boolean("yaencontre").default(false), // Yaencontre.com publication status
  enalquiler: boolean("enalquiler").default(false), // EnAlquiler.com publication status
  milanuncios: boolean("milanuncios").default(false), // Milanuncios.com publication status
  kyero: boolean("kyero").default(false), // Kyero international portal (Adevinta)
  spainhouses: boolean("spainhouses").default(false), // Spainhouses international portal (Adevinta)
  thinkspain: boolean("thinkspain").default(false), // Think Spain portal (Adevinta)
  listglobally: boolean("listglobally").default(false), // ListGlobally international portal (Adevinta)

  // Fotocasa-specific settings (explicit fields for better performance and type safety)
  fcLocationVisibility: smallint("fc_location_visibility").default(1).notNull(), // 1=Exact, 2=Street, 3=Zone
  fcPriceVisibility: boolean("fc_price_visibility").default(false).notNull(), // true=hidden, false=shown

  // Idealista-specific settings (address visibility uses fcLocationVisibility - shared with Fotocasa)
  idCoordinatesPrecision: varchar("id_coordinates_precision", { length: 10 }), // "exact" | "moved"

  // Rental-specific fields (only for rent operations)
  rentalType: varchar("rental_type", { length: 20 }), // "residential" | "seasonal" | "short_term" - MUTUALLY EXCLUSIVE
  shortTermLicense: varchar("short_term_license", { length: 100 }), // Required if rentalType = "short_term"

  // Rental Terms (deposit and guarantees)
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }), // Security deposit amount (€)
  additionalGuarantee: decimal("additional_guarantee", { precision: 10, scale: 2 }), // Additional guarantee amount (€)
  bankGuaranteeRequired: boolean("bank_guarantee_required").default(false), // Bank guarantee requirement
  managementFees: decimal("management_fees", { precision: 10, scale: 2 }), // Property management fees (€/month)
  nonPaymentInsurance: boolean("non_payment_insurance").default(false), // Landlord's non-payment insurance
  nonPaymentInsuranceAmount: decimal("non_payment_insurance_amount", { precision: 10, scale: 2 }), // Non-payment insurance cost (€/year)

  // Sale-specific fields (only for sale operations)
  occupationStatus: varchar("occupation_status", { length: 20 }), // "free" | "tenanted" | "bare_ownership" | "illegally_occupied"

  // Catalonia-specific (mandatory for rentals in Catalonia)
  priceReferenceIndex: decimal("price_reference_index", { precision: 10, scale: 2 }), // 0.01-10000, mandatory for Catalonia rentals

  // Portal-specific configuration (JSON objects containing portal settings)
  fotocasaProps: jsonb("fotocasa_props").default({}), // Legacy JSON field (migrate to explicit fields above)
  idealistaProps: jsonb("idealista_props").default({}), // Portal-specific settings for Idealista
  habitacliaProps: jsonb("habitaclia_props").default({}), // Portal-specific settings for Habitaclia
  pisoscomProps: jsonb("pisoscom_props").default({}), // Portal-specific settings for Pisos.com
  yaencontreProps: jsonb("yaencontre_props").default({}), // Portal-specific settings for Yaencontre
  enalquilerProps: jsonb("enalquiler_props").default({}), // Portal-specific settings for EnAlquiler
  milanunciosProps: jsonb("milanuncios_props").default({}), // Portal-specific settings for Milanuncios
  kyeroProps: jsonb("kyero_props").default({}), // Portal-specific settings for Kyero
  spainhousesProps: jsonb("spainhouses_props").default({}), // Portal-specific settings for Spainhouses
  thinkspainProps: jsonb("thinkspain_props").default({}), // Portal-specific settings for Think Spain
  listgloballyProps: jsonb("listglobally_props").default({}), // Portal-specific settings for ListGlobally

  // Progress Stage Tracking
  fichaCompletedAt: timestamp("ficha_completed_at"), // When all mandatory fields were first completed (24% stage)

  // System Fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Listing Activity (track important listing changes)
export const listingActivity = pgTable("listing_activity", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  listingId: bigint("listing_id", { mode: "bigint" }).notNull(), // FK → listings.listing_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (WHO changed it)
  action: varchar("action", { length: 50 }).notNull(), // 'price_changed', 'status_changed', 'portal_published', 'portal_unpublished'
  details: jsonb("details").notNull(), // { field: 'price', oldValue: 150000, newValue: 145000, reason: 'Market adjustment' }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts (external people: buyers, sellers, etc.)
export const contacts = pgTable("contacts", {
  contactId: bigserial("contact_id", { mode: "bigint" })
    .primaryKey(),
  // Account for multi-tenant security
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  nif: varchar("nif", { length: 20 }), // Spanish NIF/DNI/NIE identification number
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  phoneNotes: text("phone_notes"), // Notes for primary phone number
  secondaryPhone: varchar("secondary_phone", { length: 20 }),
  secondaryPhoneNotes: text("secondary_phone_notes"), // Notes for secondary phone number
  rating: smallint("rating"), // Contact rating (e.g., 1-5 scale for quality/importance)
  additionalInfo: jsonb("additional_info").default({}),
  orgId: bigint("org_id", { mode: "bigint" }), // Nullable FK to organizations
  source: varchar("source", { length: 100 }), // Contact source (e.g., "Website", "Walk-In", "Referral")
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Listing Contact junction table (Many-to-Many relationship between listings and contacts)
// Enhanced to replace leads table functionality
export const listingContacts = pgTable("listing_contacts", {
  listingContactId: bigserial("listing_contact_id", { mode: "bigint" })
    .primaryKey(),
  listingId: bigint("listing_id", { mode: "bigint" }), // FK → listings.listing_id (nullable)
  contactId: bigint("contact_id", { mode: "bigint" }).notNull(), // FK → contacts.contact_id
  contactType: varchar("contact_type", { length: 20 }).notNull(), // "buyer", "owner", "viewer"

  // NEW COLUMNS (from leads table):
  prospectId: bigint("prospect_id", { mode: "bigint" }), // FK → prospects.id (nullable)
  source: varchar("source", { length: 50 }), // e.g. "Website", "Walk-In", "Appointment"
  status: varchar("status", { length: 50 }), // Lead status workflow

  // Offer tracking:
  offer: integer("offer"), // Offer amount
  offerAccepted: boolean("offer_accepted"), // Whether the offer was accepted

  // Existing columns:
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Listing Contact Activity (track lead/contact changes)
export const listingContactActivity = pgTable(
  "listing_contact_activity",
  {
    id: bigserial("id", { mode: "bigint" }).primaryKey(),
    listingContactId: bigint("listing_contact_id", { mode: "bigint" }).notNull(), // FK → listing_contacts.listing_contact_id
    userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (WHO changed it)
    action: varchar("action", { length: 50 }).notNull(), // 'status_changed', 'offer_received', 'offer_accepted', 'offer_rejected', 'appointment_scheduled'
    details: jsonb("details").notNull(), // Flexible for different action types: { oldStatus, newStatus, reason } or { amount, notes }
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

// Organizations (companies, law firms, banks)
export const organizations = pgTable("organizations", {
  orgId: bigserial("org_id", { mode: "bigint" }).primaryKey(),
  orgName: varchar("org_name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  country: varchar("country", { length: 100 }),
});

// Deals (potential or closed transaction)
export const deals = pgTable("deals", {
  // Primary Key
  dealId: bigserial("deal_id", { mode: "bigint" }).primaryKey(),

  // Entity Relationships
  listingId: bigint("listing_id", { mode: "bigint" }).notNull(), // FK → listings.listing_id
  listingContactId: bigint("listing_contact_id", { mode: "bigint" }), // FK → listing_contacts.listing_contact_id (nullable)

  // Deal Status & Timeline
  status: varchar("stage", { length: 50 }).notNull(), // e.g. "Offer", "Arras Pending", "UnderContract", "Closed", "Lost"
  closeDate: timestamp("close_date"),

  // Financial Fields - Pricing
  finalPrice: decimal("final_price", { precision: 12, scale: 2 }), // Final agreed sale/rental price (may differ from listing price)

  // Financial Fields - Commission
  commissionPercentage: decimal("commission_percentage", {
    precision: 5,
    scale: 2,
  }), // Agency commission percentage (e.g., 3.00, 5.00)
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }), // Calculated commission in euros
  commissionPaidDate: timestamp("commission_paid_date"), // When commission was received

  // Financial Fields - Arras (Deposit)
  arrasAmount: decimal("arras_amount", { precision: 12, scale: 2 }), // Deposit amount (contrato de arras)
  arrasType: varchar("arras_type", { length: 20 }), // Type: 'confirmatorias' | 'penitenciales'
  arrasDate: timestamp("arras_date"), // When arras were paid

  // Financial Fields - Transaction Costs
  notaryFees: decimal("notary_fees", { precision: 10, scale: 2 }), // Estimated/actual notary costs
  registryFees: decimal("registry_fees", { precision: 10, scale: 2 }), // Property registry fees
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }), // IVA or ITP (Impuesto de Transmisiones Patrimoniales)
  mortgageAmount: decimal("mortgage_amount", { precision: 12, scale: 2 }), // Loan amount if buyer is financing

  // Timeline & Milestones
  arrasSigningDate: timestamp("arras_signing_date"), // When deposit contract was signed
  expectedDeedDate: timestamp("expected_deed_date"), // Scheduled escritura pública date
  actualDeedDate: timestamp("actual_deed_date"), // Actual deed signing date
  keyHandoverDate: timestamp("key_handover_date"), // When keys were transferred
  financingDeadline: timestamp("financing_deadline"), // Deadline for mortgage approval
  contingencyExpirationDate: timestamp("contingency_expiration_date"), // Last date for contingencies

  // Parties & Professionals - Legal
  buyerLawyerId: bigint("buyer_lawyer_id", { mode: "bigint" }), // FK → contacts (buyer's abogado)
  sellerLawyerId: bigint("seller_lawyer_id", { mode: "bigint" }), // FK → contacts (seller's abogado)
  notaryId: bigint("notary_id", { mode: "bigint" }), // FK → contacts or organizations
  notaryName: varchar("notary_name", { length: 255 }), // Notary name if not tracked as contact

  // Parties & Professionals - Financing
  bankId: bigint("bank_id", { mode: "bigint" }), // FK → organizations (mortgage bank)
  bankName: varchar("bank_name", { length: 255 }), // Bank name

  // Parties & Professionals - Agents
  listingAgentId: varchar("listing_agent_id", { length: 36 }), // FK → users (captador)
  sellingAgentId: varchar("selling_agent_id", { length: 36 }), // FK → users (vendedor/closer)
  commissionSplitListingAgent: decimal("commission_split_listing_agent", {
    precision: 5,
    scale: 2,
  }), // % for listing agent
  commissionSplitSellingAgent: decimal("commission_split_selling_agent", {
    precision: 5,
    scale: 2,
  }), // % for selling agent

  // Status & Workflow
  financingStatus: varchar("financing_status", { length: 20 }), // 'not_needed' | 'pending' | 'pre_approved' | 'approved' | 'denied'
  inspectionStatus: varchar("inspection_status", { length: 20 }), // 'pending' | 'scheduled' | 'completed' | 'issues_found'
  titleStatus: varchar("title_status", { length: 20 }), // 'pending_review' | 'clear' | 'issues_found'
  contingenciesCleared: boolean("contingencies_cleared"), // All contingencies satisfied?
  documentsComplete: boolean("documents_complete"), // All required documents received?
  riskLevel: varchar("risk_level", { length: 20 }), // 'low' | 'medium' | 'high' - risk of deal falling through

  // Required Documents Checklist (JSON)
  requiredDocuments: jsonb("required_documents").default({}), // Checklist of required documents with completion status

  // Cancellation Tracking
  cancellationReason: text("cancellation_reason"), // Why deal fell through
  faultParty: varchar("fault_party", { length: 20 }), // 'buyer' | 'seller' | 'both' | 'external' | 'none'
  arrasDisposition: varchar("arras_disposition", { length: 30 }), // 'returned_to_buyer' | 'kept_by_seller' | 'split'
  cancelledBy: varchar("cancelled_by", { length: 36 }), // FK → users (who marked it as lost/cancelled)
  cancellationDate: timestamp("cancellation_date"), // When deal was cancelled

  // Notes & Observations
  internalNotes: text("internal_notes"), // Private notes for agency use
  contingencyNotes: text("contingency_notes"), // Details about pending contingencies
  specialConditions: text("special_conditions"), // Any special terms or conditions

  // Referrals
  referralSource: varchar("referral_source", { length: 100 }), // Where deal came from
  referralPartnerId: bigint("referral_partner_id", { mode: "bigint" }), // FK → contacts/organizations
  referralFeePercentage: decimal("referral_fee_percentage", {
    precision: 5,
    scale: 2,
  }), // Fee owed to referral partner
  referralFeePaid: boolean("referral_fee_paid"), // Whether referral fee was paid

  // System Fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deal Participants (people involved in a deal)
export const dealParticipants = pgTable("deal_participants", {
  dealId: bigint("deal_id", { mode: "bigint" }).notNull(), // FK → deals.deal_id
  contactId: bigint("contact_id", { mode: "bigint" }).notNull(), // FK → contacts.contact_id
  role: varchar("role", { length: 50 }).notNull(), // e.g. "Buyer", "Seller", "Lawyer"
});

// Appointments table
export const appointments = pgTable("appointments", {
  appointmentId: bigserial("appointment_id", { mode: "bigint" })
    .primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (BetterAuth compatible)
  contactId: bigint("contact_id", { mode: "bigint" }), // FK → contacts.contact_id (nullable - for internal appointments)
  listingId: bigint("listing_id", { mode: "bigint" }), // FK → listings.listing_id (nullable)
  listingContactId: bigint("listing_contact_id", { mode: "bigint" }), // FK → listing_contacts.listing_contact_id (nullable)
  dealId: bigint("deal_id", { mode: "bigint" }), // FK → deals.deal_id (nullable)
  prospectId: bigint("prospect_id", { mode: "bigint" }), // FK → prospects.prospect_id (nullable)
  taskId: bigint("task_id", { mode: "bigint" }), // FK → tasks.task_id (nullable)
  datetimeStart: timestamp("datetime_start").notNull(),
  datetimeEnd: timestamp("datetime_end").notNull(),
  tripTimeMinutes: smallint("trip_time_minutes"), // Travel time in minutes
  status: varchar("status", { length: 20 }).notNull().default("Scheduled"),
  title: varchar("title", { length: 255 }).notNull(), // Appointment title
  notes: text("notes"),
  type: varchar("type", { length: 50 }),
  assignedTo: varchar("assigned_to", { length: 36 }), // FK → users.id (who is assigned to the appointment)
  editedBy: varchar("edited_by", { length: 36 }), // FK → users.id (who last edited the appointment)
  // Google Calendar integration fields
  googleEventId: varchar("google_event_id", { length: 255 }), // Google Calendar event ID
  googleEtag: varchar("google_etag", { length: 255 }), // For conflict resolution
  lastSyncedAt: timestamp("last_synced_at"), // Track sync status
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Integrations table (for OAuth tokens and sync metadata)
export const userIntegrations = pgTable("user_integrations", {
  integrationId: bigserial("integration_id", { mode: "bigint" })
    .primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  provider: varchar("provider", { length: 50 }).notNull(), // "google_calendar"
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiryDate: timestamp("expiry_date"),
  calendarId: varchar("calendar_id", { length: 255 }).default("primary"),
  syncToken: text("sync_token"), // For incremental sync
  channelId: varchar("channel_id", { length: 64 }), // Webhook channel ID
  resourceId: varchar("resource_id", { length: 255 }), // Webhook resource ID
  channelExpiration: timestamp("channel_expiration"),
  syncDirection: varchar("sync_direction", { length: 20 }).default(
    "vesta_to_google",
  ), // "bidirectional", "vesta_to_google", "google_to_vesta", "none" - Default is vesta_to_google (recommended)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks
export const tasks = pgTable("tasks", {
  taskId: bigserial("task_id", { mode: "bigint" }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (BetterAuth compatible)
  title: varchar("title", { length: 255 }).notNull(), // Task title
  description: text("description").notNull(),
  dueDate: timestamp("due_date"),
  dueTime: time("due_time"),
  completed: boolean("completed").default(false),
  createdBy: varchar("created_by", { length: 36 }), // FK → users.id (who created the task)
  completedBy: varchar("completed_by", { length: 36 }), // FK → users.id (who completed the task)
  editedBy: varchar("edited_by", { length: 36 }), // FK → users.id (who last edited the task)
  category: varchar("category", { length: 100 }), // Task category/type
  urgency: smallint("urgency"), // Urgency rating (1-5: 1=Low, 5=Critical)
  status: varchar("status", { length: 20 }).default("backlog"), // Task status: 'backlog' | 'blocked' | 'ready' | 'in_progress' | 'validation' | 'finished'
  listingId: bigint("listing_id", { mode: "bigint" }), // FK → listings.listing_id (nullable)
  listingContactId: bigint("listing_contact_id", { mode: "bigint" }), // FK → listing_contacts.listing_contact_id (nullable)
  dealId: bigint("deal_id", { mode: "bigint" }), // FK → deals.deal_id (nullable)
  appointmentId: bigint("appointment_id", { mode: "bigint" }), // FK → appointments.appointment_id (nullable)
  prospectId: bigint("prospect_id", { mode: "bigint" }), // FK → prospects.prospect_id (nullable)
  contactId: bigint("contact_id", { mode: "bigint" }), // FK → contacts.contact_id (nullable)
  activityId: bigint("activity_id", { mode: "bigint" }), // FK → activity log/table (nullable)
  activityType: varchar("activity_type", { length: 50 }), // Type of activity this task is related to (e.g., 'contact_activity', 'listing_contact_activity')
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Documents table
export const documents = pgTable("documents", {
  docId: bigserial("doc_id", { mode: "bigint" }).primaryKey(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // e.g. "PDF", "DOC", "Image"
  fileUrl: varchar("file_url", { length: 2048 }).notNull(), // Public S3 URL
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (who uploaded, BetterAuth compatible)

  // Entity relationships (only one should be set per document)
  propertyId: bigint("property_id", { mode: "bigint" }), // FK → properties.property_id (nullable)
  contactId: bigint("contact_id", { mode: "bigint" }), // FK → contacts.contact_id (nullable)
  listingId: bigint("listing_id", { mode: "bigint" }), // FK → listings.listing_id (nullable)
  listingContactId: bigint("listing_contact_id", { mode: "bigint" }), // FK → listing_contacts.listing_contact_id (nullable)
  dealId: bigint("deal_id", { mode: "bigint" }), // FK → deals.deal_id (nullable)
  appointmentId: bigint("appointment_id", { mode: "bigint" }), // FK → appointments.appointment_id (nullable)
  prospectId: bigint("prospect_id", { mode: "bigint" }), // FK → prospects.prospect_id (nullable)

  // AWS S3 fields (similar to property_images)
  documentKey: varchar("document_key", { length: 2048 }).notNull(), // S3 object key for operations
  s3key: varchar("s3key", { length: 2048 }).notNull(), // S3 storage key
  documentTag: varchar("document_tag", { length: 255 }), // Category/type tag (e.g., "contract", "ID", "deed")
  documentOrder: integer("document_order").default(0).notNull(), // Display order within entity

  // Document integrity fields
  documentHash: varchar("document_hash", { length: 64 }), // SHA-256 hash (64 hex characters)
  documentTimestamp: timestamp("document_timestamp"), // ISO timestamp when document was created/signed

  // System fields
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Prospects table (Enhanced for dual-type prospect system)
export const prospects = pgTable("prospects", {
  id: bigserial("prospect_id", { mode: "bigint" }).primaryKey(),
  contactId: bigint("contact_id", { mode: "bigint" }).notNull(), // FK → contacts.id
  status: varchar("status", { length: 50 }).notNull(), // ENUM equivalent - index this
  listingType: varchar("listing_type", { length: 20 }), // ENUM('Sale', 'Rent') - type of listing they're looking for

  // Dual-type discriminator field
  prospectType: varchar("prospect_type", { length: 20 })
    .notNull()
    .default("search"), // 'search' | 'listing'

  // Search prospect fields (existing - for people looking FOR properties)
  propertyType: varchar("property_type", { length: 20 }), // ENUM('piso','casa','garaje','local','terreno')
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  preferredCities: jsonb("preferred_cities"), // Array of city names: ["Madrid", "Barcelona"]
  preferredAreas: jsonb("preferred_areas"), // Array of neighborhood objects: [{"neighborhoodId": 1, "name": "Salamanca"}, {"neighborhoodId": 2, "name": "Retiro"}]
  minBedrooms: smallint("min_bedrooms"), // 0-10 is enough
  minBathrooms: smallint("min_bathrooms"), // Same
  minSquareMeters: integer("min_square_meters"),
  maxSquareMeters: integer("max_square_meters"),
  moveInBy: timestamp("move_in_by"), // Desired move-in date; leave NULL if "when something comes up"
  extras: jsonb("extras"), // { "ascensor": true, "terraza": true, "garaje": false }
  urgencyLevel: smallint("urgency_level"), // 1-5 - homemade lead-scoring
  fundingReady: boolean("funding_ready"), // Has mortgage/pre-approval?

  // Listing prospect fields (new - for people wanting to LIST properties)
  // NOTE: These fields are commented out because they don't exist in the database yet
  // propertyToList: jsonb("property_to_list"), // { address, propertyType, estimatedValue, condition, readyToList }
  // valuationStatus: varchar("valuation_status", { length: 50 }), // 'pending' | 'scheduled' | 'completed'
  // listingAgreementStatus: varchar("listing_agreement_status", { length: 50 }), // 'not_started' | 'in_progress' | 'signed'

  // Common fields
  notesInternal: text("notes_internal"), // Everything the client shouldn't see
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Prospect History table to track status changes
export const prospectHistory = pgTable("prospect_history", {
  historyId: bigserial("history_id", { mode: "bigint" })
    .primaryKey(),
  prospectId: bigint("prospect_id", { mode: "bigint" }).notNull(),
  previousStatus: varchar("previous_status", { length: 50 }),
  newStatus: varchar("new_status", { length: 50 }).notNull(),
  changedBy: varchar("changed_by", { length: 36 }).notNull(), // FK → users.id (BetterAuth compatible)
  changeReason: text("change_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prospect-Listing Matches table (pre-calculated matches for performance)
// Indexes will be created in migration file for better control
export const prospectListingMatches = pgTable("prospect_listing_matches", {
  // Primary Key
  id: bigserial("id", { mode: "bigint" }).primaryKey(),

  // Foreign Keys
  prospectId: bigint("prospect_id", { mode: "bigint" }).notNull(), // FK → prospects.prospect_id
  listingId: bigint("listing_id", { mode: "bigint" }).notNull(), // FK → listings.listing_id
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id (for multi-tenant queries)

  // Match Quality Score (0-100)
  matchQualityScore: smallint("match_quality_score"), // Overall quality score: considers all factors weighted
  confidenceLevel: varchar("confidence_level", { length: 20 }), // 'high' | 'medium' | 'low' based on match quality

  // Match Metadata
  matchType: varchar("match_type", { length: 20 }).notNull(), // 'strict' | 'near-strict'
  toleranceReasons: jsonb("tolerance_reasons"), // Array of strings: ["Price +3.2%", "Area -4.1%"]
  priceMatch: varchar("price_match", { length: 20 }).notNull(), // 'exact' | 'tolerance' | 'out-of-range'

  // Cross-Account Flag
  isCrossAccount: boolean("is_cross_account").notNull().default(false),
  crossAccountId: bigint("cross_account_id", { mode: "bigint" }), // Account ID of the listing if cross-account

  // Detailed Match Scores (for sorting and filtering)
  priceMatchScore: smallint("price_match_score"), // 0-100: How well price matches (100 = exact, lower = more deviation)
  locationMatchScore: smallint("location_match_score"), // 0-100: How well location matches
  featureMatchScore: smallint("feature_match_score"), // 0-100: How many required features are met
  sizeMatchScore: smallint("size_match_score"), // 0-100: How well bedrooms/bathrooms/area match
  urgencyScore: smallint("urgency_score"), // 0-100: Based on prospect's urgency level and moveInBy date

  // Tolerance Details (for debugging/filtering)
  priceDeviation: decimal("price_deviation", { precision: 5, scale: 2 }), // Percentage deviation from prospect's range
  areaDeviation: decimal("area_deviation", { precision: 5, scale: 2 }), // Percentage deviation from prospect's range
  bedroomDifference: smallint("bedroom_difference"), // Difference: listing.bedrooms - prospect.minBedrooms (positive = extra bedrooms)
  bathroomDifference: smallint("bathroom_difference"), // Difference: listing.bathrooms - prospect.minBathrooms

  // Location Match Details
  locationMatchType: varchar("location_match_type", { length: 20 }), // 'string-similarity' | 'geolocation' | 'both' | 'exact'
  distanceKm: decimal("distance_km", { precision: 5, scale: 2 }), // Distance in kilometers if geolocation match
  neighborhoodMatch: boolean("neighborhood_match"), // True if neighborhood name matches exactly

  // Feature Matching Details
  missingFeatures: jsonb("missing_features"), // Array of features prospect wants but listing doesn't have: ["elevator", "garage"]
  extraFeatures: jsonb("extra_features"), // Array of bonus features listing has that prospect didn't require: ["pool", "garden"]
  featureMatchPercentage: smallint("feature_match_percentage"), // 0-100: Percentage of required features that are present

  // Business Logic Flags
  isAutoMatched: boolean("is_auto_matched").default(true), // True if auto-calculated, false if manually created by agent
  requiresManualReview: boolean("requires_manual_review").default(false), // Flag for matches that need agent review
  reviewedBy: varchar("reviewed_by", { length: 36 }), // FK → users.id (agent who reviewed this match)
  reviewedAt: timestamp("reviewed_at"), // When the match was manually reviewed
  reviewNotes: text("review_notes"), // Agent notes about this match

  // Match Status Tracking
  matchStatus: varchar("match_status", { length: 30 }).default("new"), // 'new' | 'viewed' | 'shared' | 'contacted' | 'dismissed' | 'lead_created'
  viewedAt: timestamp("viewed_at"), // When agent first viewed this match
  viewCount: integer("view_count").default(0), // How many times this match was viewed
  sharedAt: timestamp("shared_at"), // When match was shared with prospect
  sharedBy: varchar("shared_by", { length: 36 }), // FK → users.id (agent who shared)

  // Dismissal Tracking
  dismissedAt: timestamp("dismissed_at"), // When match was dismissed
  dismissedBy: varchar("dismissed_by", { length: 36 }), // FK → users.id (who dismissed it)
  dismissalReason: varchar("dismissal_reason", { length: 50 }), // 'not_interested' | 'already_seen' | 'wrong_criteria' | 'other'
  dismissalNotes: text("dismissal_notes"), // Optional notes about why dismissed

  // Analytics & ML Features
  prospectEngagementScore: smallint("prospect_engagement_score"), // 0-100: How engaged this prospect typically is
  historicalConversionRate: decimal("historical_conversion_rate", {
    precision: 5,
    scale: 2,
  }), // Percentage: Similar matches that converted to deals
  similarMatchesCount: integer("similar_matches_count"), // How many similar matches exist for this prospect
  competitionLevel: varchar("competition_level", { length: 20 }), // 'high' | 'medium' | 'low' (how many other prospects match this listing)

  // Time-sensitive Factors
  prospectUrgency: smallint("prospect_urgency"), // 1-5: Copy of prospect's urgency level at time of match
  daysUntilMoveIn: integer("days_until_move_in"), // Days between calculatedAt and prospect's moveInBy date
  listingAgeInDays: integer("listing_age_in_days"), // How old the listing was when match was calculated
  isNewListing: boolean("is_new_listing"), // True if listing was created within last 7 days

  // Notification & Communication Tracking
  notificationSent: boolean("notification_sent").default(false), // Whether agent was notified about this match
  notificationSentAt: timestamp("notification_sent_at"),
  prospectNotified: boolean("prospect_notified").default(false), // Whether prospect was notified
  prospectNotifiedAt: timestamp("prospect_notified_at"),
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),

  // Pricing Intelligence
  pricePerSqMeter: decimal("price_per_sq_meter", { precision: 10, scale: 2 }), // Calculated at match time
  isGoodDeal: boolean("is_good_deal"), // True if price is below market average for area
  marketPriceDeviation: decimal("market_price_deviation", {
    precision: 5,
    scale: 2,
  }), // Percentage above/below market price

  // Timestamps
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // For TTL-based invalidation (optional)
  firstCalculatedAt: timestamp("first_calculated_at"), // When this match was first created (doesn't change on recalc)

  // Soft Delete / Stale Flag
  isStale: boolean("is_stale").default(false), // Mark as stale instead of deleting
  staleReason: varchar("stale_reason", { length: 100 }), // 'recalculated' | 'prospect_updated' | 'listing_updated' | 'listing_sold'

  // System Fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),

  // Version tracking (for schema evolution)
  schemaVersion: smallint("schema_version").default(1), // Track which version of matching algorithm was used
});

// Testimonials table
export const testimonials = pgTable("testimonials", {
  testimonialId: bigserial("testimonial_id", { mode: "bigint" })
    .primaryKey(),
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  content: text("content").notNull(),
  avatar: varchar("avatar", { length: 1024 }),
  rating: smallint("rating").notNull().default(5),
  isVerified: boolean("is_verified").default(true),
  sortOrder: integer("sort_order").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Website configuration table
export const websiteProperties = pgTable("website_config", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  socialLinks: text("social_links").notNull(), // JSON containing social media links
  seoProps: text("seo_props").notNull(), // JSON containing SEO properties
  logo: varchar("logo", { length: 1024 }).notNull(), // URL to logo file
  logotype: varchar("logotype", { length: 1024 }).notNull(), // URL to logotype file
  favicon: varchar("favicon", { length: 1024 }).notNull(), // URL to favicon file
  heroProps: text("hero_props").notNull(), // JSON containing hero section properties
  featuredProps: text("featured_props").notNull(), // JSON containing featured section properties
  aboutProps: text("about_props").notNull(), // JSON containing about section properties
  propertiesProps: text("properties_props").notNull(), // JSON containing properties section configuration
  testimonialProps: text("testimonial_props").notNull(), // JSON containing testimonial section properties
  contactProps: text("contact_props"), // JSON containing contact section properties
  footerProps: text("footer_props").notNull(), // JSON containing footer configuration
  headProps: text("head_props").notNull(), // JSON containing head section properties
  watermarkProps: text("watermark_props").notNull().default("{}"), // JSON containing watermark configuration
  metadata: text("metadata"), // JSON containing metadata configuration
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table
export const comments = pgTable("comments", {
  commentId: bigserial("comment_id", { mode: "bigint" })
    .primaryKey(),
  listingId: bigint("listing_id", { mode: "bigint" }).notNull(), // FK → listings.listing_id
  propertyId: bigint("property_id", { mode: "bigint" }).notNull(), // FK → properties.property_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }), // Comment category/type
  parentId: bigint("parent_id", { mode: "bigint" }), // Self-reference for replies
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User Comments table (Contact-based comments)
export const userComments = pgTable("user_comments", {
  commentId: bigserial("comment_id", { mode: "bigint" })
    .primaryKey(),
  contactId: bigint("contact_id", { mode: "bigint" }).notNull(), // FK → contacts.contact_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  content: text("content").notNull(),
  parentId: bigint("parent_id", { mode: "bigint" }), // Self-reference for replies
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Listing Contact Comments table (Comments on listing-contact relationships)
export const listingContactComments = pgTable("listing_contact_comments", {
  commentId: bigserial("comment_id", { mode: "bigint" })
    .primaryKey(),
  listingContactId: bigint("listing_contact_id", { mode: "bigint" }).notNull(), // FK → listing_contacts.listing_contact_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }), // e.g., "general", "offer", "viewing", "negotiation", "follow_up", "internal"
  parentId: bigint("parent_id", { mode: "bigint" }), // Self-reference for replies
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Appointment Comments table (Comments on appointments)
export const appointmentComments = pgTable("appointment_comments", {
  commentId: bigserial("comment_id", { mode: "bigint" })
    .primaryKey(),
  appointmentId: bigint("appointment_id", { mode: "bigint" }).notNull(), // FK → appointments.appointment_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  content: text("content").notNull(),
  parentId: bigint("parent_id", { mode: "bigint" }), // Self-reference for replies
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task Comments table (Comments on tasks)
export const taskComments = pgTable("task_comments", {
  commentId: bigserial("comment_id", { mode: "bigint" })
    .primaryKey(),
  taskId: bigint("task_id", { mode: "bigint" }).notNull(), // FK → tasks.task_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  content: text("content").notNull(),
  parentId: bigint("parent_id", { mode: "bigint" }), // Self-reference for replies
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cartel Configurations table
export const cartelConfigurations = pgTable("cartel_configurations", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  userId: varchar("user_id", { length: 36 }), // FK → users.id (nullable)
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  propertyId: bigint("property_id", { mode: "bigint" }), // FK → properties.property_id (nullable)
  name: varchar("name", { length: 255 }).notNull(),
  templateConfig: jsonb("template_config").notNull(),
  propertyOverrides: jsonb("property_overrides").default("{}"),
  selectedContacts: jsonb("selected_contacts").default("{}"),
  selectedImageIndices: jsonb("selected_image_indices").default("[]"),
  isDefault: boolean("is_default").default(false),
  isGlobal: boolean("is_global").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback table
export const feedback = pgTable("feedback", {
  feedbackId: bigserial("feedback_id", { mode: "bigint" })
    .primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  feedbackComment: text("feedback_comment").notNull(),
  scale: smallint("scale").notNull(), // 1-4 scale rating
  url: varchar("url", { length: 2048 }), // URL where feedback was submitted
  status: varchar("status", { length: 50 }).default("submitted").notNull(), // submitted, backlog, resolved, evaluating, testing, ongoing
  resolved: boolean("resolved").default(false).notNull(), // 1=resolved, 0=unresolved (kept for backward compatibility)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Account-specific roles table
export const accountRoles = pgTable("account_roles", {
  accountRoleId: bigserial("account_role_id", { mode: "bigint" })
    .primaryKey(),
  roleId: bigint("role_id", { mode: "bigint" }).notNull(), // References the role type (1=Superadmin [internal only], 2=Agent, 3=Account Admin, 4=Office Manager, 5=Inactive)
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  permissions: jsonb("permissions").notNull().default({}), // JSON with all permissions for this role in this account
  isSystem: boolean("is_system").default(false), // True for default roles that shouldn't be deleted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Notifications table
export const notifications = pgTable("notifications", {
  // Primary Key
  notificationId: bigserial("notification_id", { mode: "bigint" })
    .primaryKey(),

  // Account for multi-tenant security
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id

  // User targeting
  userId: varchar("user_id", { length: 36 }), // FK → users.id (null = broadcast to all account users)
  fromUserId: varchar("from_user_id", { length: 36 }), // FK → users.id (who triggered it, can be system)

  // Notification content
  type: varchar("type", { length: 50 }).notNull(), // 'appointment_reminder', 'new_lead', 'property_update', 'task_due', 'deal_status', 'document_uploaded', 'comment_reply', 'portal_sync', 'system_alert'
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  actionUrl: varchar("action_url", { length: 500 }), // Where to navigate when clicked

  // Priority and categorization
  priority: varchar("priority", { length: 20 }).default("normal"), // 'low', 'normal', 'high', 'urgent'
  category: varchar("category", { length: 50 }).notNull(), // 'appointments', 'properties', 'contacts', 'deals', 'tasks', 'system'

  // Entity relationships (polymorphic references)
  entityType: varchar("entity_type", { length: 50 }), // 'property', 'listing', 'contact', 'appointment', 'task', 'deal', 'prospect', 'document'
  entityId: bigint("entity_id", { mode: "bigint" }), // ID of the related entity

  // Additional metadata
  metadata: jsonb("metadata").default({}), // Flexible field for extra data (e.g., appointment time, property address)

  // Notification state
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  isDismissed: boolean("is_dismissed").default(false),
  dismissedAt: timestamp("dismissed_at"),

  // Delivery tracking
  deliveryChannel: varchar("delivery_channel", { length: 50 }).default(
    "in_app",
  ), // 'in_app', 'email', 'push', 'sms'
  isDelivered: boolean("is_delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  deliveryError: text("delivery_error"), // Error message if delivery failed

  // Scheduling (for future notifications)
  scheduledFor: timestamp("scheduled_for"), // When to send (null = immediate)
  expiresAt: timestamp("expires_at"), // Auto-dismiss after this time

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Push Subscriptions table (for browser push notifications)
export const pushSubscriptions = pgTable("push_subscriptions", {
  subscriptionId: bigserial("subscription_id", { mode: "bigint" })
    .primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id
  endpoint: text("endpoint").notNull(), // Push service URL
  p256dh: text("p256dh").notNull(), // Encryption key
  auth: text("auth").notNull(), // Auth secret
  userAgent: text("user_agent"), // Device/browser info (optional)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Deal Activity (track important deal changes and milestones)
export const dealActivity = pgTable("deal_activity", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  dealId: bigint("deal_id", { mode: "bigint" }).notNull(), // FK → deals.deal_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (WHO changed it)
  action: varchar("action", { length: 50 }).notNull(), // 'deal_created', 'status_changed', 'price_changed', 'commission_paid', 'arras_received', 'deed_signed', 'deal_closed', 'deal_cancelled', etc.
  details: jsonb("details").notNull(), // Action-specific data: { oldValue, newValue, reason, etc. }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contact Activity (track contact lifecycle and GDPR compliance)
export const contactActivity = pgTable("contact_activity", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  contactId: bigint("contact_id", { mode: "bigint" }).notNull(), // FK → contacts.contact_id
  userId: varchar("user_id", { length: 36 }).notNull(), // FK → users.id (WHO changed it, or 'system' for automated)
  action: varchar("action", { length: 50 }).notNull(), // 'contact_created', 'contact_deactivated', 'consent_given', 'consent_withdrawn', 'gdpr_data_export_requested', etc.
  details: jsonb("details").notNull(), // Action-specific data: { reason, method, compliance info, etc. }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mappings table (for data ingestion column mappings)
export const mappings = pgTable("mappings", {
  // Primary Key
  sourceId: bigserial("source_id", { mode: "bigint" })
    .primaryKey(),

  // Source information
  sourceName: varchar("source_name", { length: 255 }).notNull(), // e.g., "Inmogesco", "Aliseda", "Custom CRM"

  // Mapping configuration
  mappings: jsonb("mappings").notNull(), // JSON object containing column mappings

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

// Fotocasa Logs table (for tracking Fotocasa API interactions)
export const fotocasaLogs = pgTable("fotocasa_logs", {
  // Primary Key
  id: bigserial("id", { mode: "bigint" }).primaryKey(),

  // Timestamp
  timestamp: timestamp("timestamp").notNull(),

  // Listing reference
  listingId: bigint("listing_id", { mode: "bigint" }), // FK → listings.listing_id (nullable for build_payload operations)

  // Operation type
  operation: varchar("operation", { length: 20 }).notNull(), // 'BUILD_PAYLOAD' | 'POST' | 'PUT' | 'DELETE'

  // Request and response data
  requestData: jsonb("request_data"), // Request payload (sanitized)
  responseData: jsonb("response_data"), // Response payload (sanitized)

  // Operation result
  success: boolean("success").notNull(),
  error: text("error"), // Error message if operation failed

  // Additional metadata
  metadata: jsonb("metadata"), // Additional context (e.g., watermarked images count)

  // System field
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Image Token Transactions table (track all token usage and purchases)
export const imageTokenTransactions = pgTable("image_token_transactions", {
  // Primary Key
  transactionId: bigserial("transaction_id", { mode: "bigint" })
    .primaryKey(),

  // Account reference
  accountId: bigint("account_id", { mode: "bigint" }).notNull(), // FK → accounts.account_id

  // Transaction type and details
  operation: varchar("operation", { length: 50 }).notNull(), // 'freepik_enhance' | 'gemini_renovate' | 'gemini_detect' | 'token_purchase' | 'admin_credit' | 'admin_debit'
  tokensChanged: integer("tokens_changed").notNull(), // Positive for purchases/credits, negative for usage
  beforeBalance: integer("before_balance").notNull(), // Token balance before transaction
  afterBalance: integer("after_balance").notNull(), // Token balance after transaction

  // Operation metadata (flexible JSON for different operation types)
  metadata: jsonb("metadata").default({}), // { imageWidth, imageHeight, upscaleFactor, roomType, style, etc. }

  // Related entities
  propertyImageId: bigint("property_image_id", { mode: "bigint" }), // FK → property_images (nullable)
  propertyId: bigint("property_id", { mode: "bigint" }), // FK → properties (nullable)
  userId: varchar("user_id", { length: 36 }), // FK → users.id (who performed the operation)

  // Payment/purchase details (for token purchases)
  purchaseAmount: decimal("purchase_amount", { precision: 10, scale: 2 }), // Amount paid in EUR (nullable)
  paymentMethod: varchar("payment_method", { length: 50 }), // 'stripe' | 'paypal' | 'manual' | null
  paymentReference: varchar("payment_reference", { length: 255 }), // External payment ID

  // System fields
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});
