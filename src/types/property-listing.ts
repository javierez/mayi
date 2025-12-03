// Shared PropertyListing interface for consistent typing across the application
export interface PropertyListing {
  // Core IDs
  propertyId?: number | string;
  listingId?: number | string;

  // Basic property info
  propertyType?: string;
  propertySubtype?: string;
  title?: string;
  listingType?: string;
  status?: string;
  price?: number | string;
  cadastralReference?: string;

  // Status flags
  isBankOwned?: boolean;
  isFeatured?: boolean;
  newConstruction?: boolean;
  publishToWebsite?: boolean;
  hasKeys?: boolean;
  hasCartel?: boolean;
  enEscaparate?: boolean;
  encargo?: boolean;
  offerAccepted?: boolean;
  hasScheduledVisits?: boolean;

  // Rental-specific fields (only for rent operations)
  rentalType?: "residential" | "seasonal" | "short_term";
  shortTermLicense?: string;

  // Sale-specific fields (only for sale operations)
  occupationStatus?: "free" | "tenanted" | "bare_ownership" | "illegally_occupied";
  
  // Portal publication flags
  fotocasa?: boolean;
  idealista?: boolean;
  habitaclia?: boolean;
  milanuncios?: boolean;

  // Fotocasa-specific settings (explicit fields for better performance)
  fcLocationVisibility?: number; // 1=Exact, 2=Street, 3=Zone
  fcPriceVisibility?: boolean; // true=hidden, false=shown

  // Dimensions
  bedrooms?: number;
  bathrooms?: number;
  squareMeter?: number;
  builtSurfaceArea?: number;

  // Construction details
  yearBuilt?: number;
  lastRenovationYear?: string;
  buildingFloors?: number;
  conservationStatus?: number;

  // Location
  street?: string;
  addressDetails?: string;
  postalCode?: string;
  neighborhoodId?: number | bigint; // Foreign key to locations table
  neighborhood?: string;
  city?: string;
  province?: string;
  municipality?: string;
  latitude?: string;
  longitude?: string;

  // Features
  hasElevator?: boolean;
  hasGarage?: boolean;
  garageType?: string;
  garageSpaces?: number;
  garageInBuilding?: boolean;
  garageNumber?: string;
  optionalGaragePrice?: number;

  // Storage
  hasStorageRoom?: boolean;
  storageRoomSize?: number;
  storageRoomNumber?: string;
  optionalStorageRoomPrice?: number;

  // Utilities
  hasHeating?: boolean;
  heatingType?: string;
  hotWaterType?: string;
  airConditioningType?: string;

  // Furnishing
  isFurnished?: boolean;
  furnitureQuality?: string;
  studentFriendly?: boolean;
  petsAllowed?: boolean;
  appliancesIncluded?: boolean;

  // Characteristics
  exterior?: boolean;
  orientation?: string;
  bright?: boolean;
  disabledAccessible?: boolean;
  vpo?: boolean;

  // Security & amenities
  videoIntercom?: boolean;
  conciergeService?: boolean;
  securityGuard?: boolean;
  satelliteDish?: boolean;
  doubleGlazing?: boolean;
  alarm?: boolean;
  securityDoor?: boolean;

  // Kitchen
  kitchenType?: string;
  openKitchen?: boolean;
  frenchKitchen?: boolean;
  furnishedKitchen?: boolean;
  pantry?: boolean;

  // Outdoor spaces
  terrace?: boolean;
  terraceSize?: number;
  wineCellar?: boolean;
  wineCellarSize?: number;
  livingRoomSize?: number;
  balconyCount?: number;
  galleryCount?: number;

  // Materials & finishes
  builtInWardrobes?: string;
  mainFloorType?: string;
  shutterType?: string;
  carpentryType?: string;
  windowType?: string;

  // Utilities and Installations
  electricityType?: string;
  electricityStatus?: string;
  plumbingType?: string;
  plumbingStatus?: string;

  // Views
  views?: boolean;
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;

  // Luxury features
  jacuzzi?: boolean;
  hydromassage?: boolean;
  garden?: boolean;
  pool?: boolean;
  homeAutomation?: boolean;
  musicSystem?: boolean;

  // Additional spaces
  laundryRoom?: boolean;
  coveredClothesline?: boolean;
  fireplace?: boolean;
  sauna?: boolean;
  loadingArea?: boolean;
  patio?: boolean;
  allowedUse?: number; // Allowed use for solar/land properties (1-9 enum)
  isDiafano?: boolean; // Only for 'local' property type - open-plan/open-space commercial
  hasEscaparate?: boolean; // Only for 'local' property type - has shop window/storefront
  streetType?: string; // Only for 'local' - traffic intensity: muy_transitada, transitada, moderada, poco_transitada
  gym?: boolean;
  sportsArea?: boolean;
  childrenArea?: boolean;
  suiteBathroom?: boolean;

  // Community features
  nearbyPublicTransport?: boolean;
  communityPool?: boolean;
  privatePool?: boolean;
  tennisCourt?: boolean;
  communityArea?: boolean;

  // Appliances
  internet?: boolean;
  oven?: boolean;
  microwave?: boolean;
  washingMachine?: boolean;
  secadora?: boolean;
  fridge?: boolean;
  tv?: boolean;
  stoneware?: boolean;

  // Content
  description?: string;
  shortDescription?: string;

  // Relationships
  agent?: {
    id: string;
    name: string;
  };
  owners?: Array<{
    id: number;
    name: string;
  }>;
  deal?: {
    dealId: number | bigint;
    listingId: number | bigint;
    status: string;
    arrasDate: Date | null;
    arrasSigningDate: Date | null;
    expectedDeedDate: Date | null;
    actualDeedDate: Date | null;
    closeDate: Date | null;
    keyHandoverDate: Date | null;
  } | null;

  // Timestamps
  createdAt?: Date | null;
  updatedAt?: Date | null;

  // Progress Stage Tracking
  fichaCompletedAt?: Date | null;
}

// Type guard to check if an object is a PropertyListing
export function isPropertyListing(obj: unknown): obj is PropertyListing {
  return (
    typeof obj === "object" &&
    obj !== null &&
    ("propertyId" in obj || "listingId" in obj)
  );
}

// Utility function to convert database listing to PropertyListing
export function convertDbListingToPropertyListing(
  dbListing: Record<string, unknown>,
): PropertyListing {
  // Helper function to safely cast types
  const getNumber = (value: unknown): number | undefined =>
    value ? Number(value) : undefined;
  const getBoolean = (value: unknown): boolean | undefined =>
    value === null || value === undefined ? undefined : Boolean(value);

  return {
    propertyId: dbListing.propertyId ? Number(dbListing.propertyId) : undefined,
    listingId: dbListing.listingId ? Number(dbListing.listingId) : undefined,
    propertyType: (dbListing.propertyType as string) ?? undefined,
    propertySubtype: (dbListing.propertySubtype as string) ?? undefined,
    title: (dbListing.title as string) ?? undefined,
    listingType: (dbListing.listingType as string) ?? undefined,
    status: (dbListing.status as string) ?? undefined,
    price: (dbListing.price as string | number) ?? undefined,
    cadastralReference: (dbListing.cadastralReference as string) ?? undefined,
    isBankOwned: (dbListing.isBankOwned as boolean) ?? undefined,
    isFeatured: (dbListing.isFeatured as boolean) ?? undefined,
    newConstruction: (dbListing.newConstruction as boolean) ?? undefined,
    publishToWebsite: (dbListing.publishToWebsite as boolean) ?? undefined,
    hasKeys: getBoolean(dbListing.hasKeys),
    hasCartel: getBoolean(dbListing.hasCartel),
    enEscaparate: getBoolean(dbListing.enEscaparate),
    encargo: (dbListing.encargo as boolean) ?? undefined,
    offerAccepted: (dbListing.offerAccepted as boolean) ?? undefined,
    hasScheduledVisits: (dbListing.hasScheduledVisits as boolean) ?? undefined,
    rentalType: (dbListing.rentalType as PropertyListing["rentalType"]) ?? undefined,
    shortTermLicense: (dbListing.shortTermLicense as string) ?? undefined,
    occupationStatus: (dbListing.occupationStatus as PropertyListing["occupationStatus"]) ?? undefined,
    fotocasa: getBoolean(dbListing.fotocasa),
    idealista: getBoolean(dbListing.idealista),
    habitaclia: getBoolean(dbListing.habitaclia),
    milanuncios: getBoolean(dbListing.milanuncios),
    fcLocationVisibility: getNumber(dbListing.fcLocationVisibility),
    fcPriceVisibility: getBoolean(dbListing.fcPriceVisibility),
    bedrooms: (dbListing.bedrooms as number) ?? undefined,
    bathrooms: (dbListing.bathrooms as number) ?? undefined,
    squareMeter: (dbListing.squareMeter as number) ?? undefined,
    builtSurfaceArea: (dbListing.builtSurfaceArea as number) ?? undefined,
    yearBuilt: (dbListing.yearBuilt as number) ?? undefined,
    lastRenovationYear: (dbListing.lastRenovationYear as string) ?? undefined,
    buildingFloors: (dbListing.buildingFloors as number) ?? undefined,
    conservationStatus: (dbListing.conservationStatus as number) ?? undefined,
    street: (dbListing.street as string) ?? undefined,
    addressDetails: (dbListing.addressDetails as string) ?? undefined,
    postalCode: (dbListing.postalCode as string) ?? undefined,
    neighborhoodId: dbListing.neighborhoodId
      ? Number(dbListing.neighborhoodId)
      : undefined,
    neighborhood: (dbListing.neighborhood as string) ?? undefined,
    city: (dbListing.city as string) ?? undefined,
    province: (dbListing.province as string) ?? undefined,
    municipality: (dbListing.municipality as string) ?? undefined,
    latitude: (dbListing.latitude as string) ?? undefined,
    longitude: (dbListing.longitude as string) ?? undefined,
    hasElevator: (dbListing.hasElevator as boolean) ?? undefined,
    hasGarage: (dbListing.hasGarage as boolean) ?? undefined,
    garageType: (dbListing.garageType as string) ?? undefined,
    garageSpaces: (dbListing.garageSpaces as number) ?? undefined,
    garageInBuilding: (dbListing.garageInBuilding as boolean) ?? undefined,
    garageNumber: (dbListing.garageNumber as string) ?? undefined,
    optionalGaragePrice: (dbListing.optionalGaragePrice as number) ?? undefined,
    hasStorageRoom: (dbListing.hasStorageRoom as boolean) ?? undefined,
    storageRoomSize: (dbListing.storageRoomSize as number) ?? undefined,
    storageRoomNumber: (dbListing.storageRoomNumber as string) ?? undefined,
    optionalStorageRoomPrice:
      (dbListing.optionalStorageRoomPrice as number) ?? undefined,
    hasHeating: (dbListing.hasHeating as boolean) ?? undefined,
    heatingType: (dbListing.heatingType as string) ?? undefined,
    hotWaterType: (dbListing.hotWaterType as string) ?? undefined,
    airConditioningType: (dbListing.airConditioningType as string) ?? undefined,
    isFurnished: (dbListing.isFurnished as boolean) ?? undefined,
    furnitureQuality: (dbListing.furnitureQuality as string) ?? undefined,
    studentFriendly: getBoolean(dbListing.studentFriendly),
    petsAllowed: getBoolean(dbListing.petsAllowed),
    appliancesIncluded: getBoolean(dbListing.appliancesIncluded),
    exterior: getBoolean(dbListing.exterior),
    orientation: (dbListing.orientation as string) ?? undefined,
    bright: getBoolean(dbListing.bright),
    disabledAccessible: getBoolean(dbListing.disabledAccessible),
    vpo: getBoolean(dbListing.vpo),
    videoIntercom: getBoolean(dbListing.videoIntercom),
    conciergeService: getBoolean(dbListing.conciergeService),
    securityGuard: getBoolean(dbListing.securityGuard),
    satelliteDish: getBoolean(dbListing.satelliteDish),
    doubleGlazing: getBoolean(dbListing.doubleGlazing),
    alarm: getBoolean(dbListing.alarm),
    securityDoor: getBoolean(dbListing.securityDoor),
    kitchenType: (dbListing.kitchenType as string) ?? undefined,
    openKitchen: getBoolean(dbListing.openKitchen),
    frenchKitchen: getBoolean(dbListing.frenchKitchen),
    furnishedKitchen: getBoolean(dbListing.furnishedKitchen),
    pantry: getBoolean(dbListing.pantry),
    terrace: getBoolean(dbListing.terrace),
    terraceSize: getNumber(dbListing.terraceSize),
    wineCellar: getBoolean(dbListing.wineCellar),
    wineCellarSize: getNumber(dbListing.wineCellarSize),
    livingRoomSize: getNumber(dbListing.livingRoomSize),
    balconyCount: getNumber(dbListing.balconyCount),
    galleryCount: getNumber(dbListing.galleryCount),
    builtInWardrobes: (dbListing.builtInWardrobes as string) ?? undefined,
    mainFloorType: (dbListing.mainFloorType as string) ?? undefined,
    shutterType: (dbListing.shutterType as string) ?? undefined,
    carpentryType: (dbListing.carpentryType as string) ?? undefined,
    windowType: (dbListing.windowType as string) ?? undefined,
    electricityType: (dbListing.electricityType as string) ?? undefined,
    electricityStatus: (dbListing.electricityStatus as string) ?? undefined,
    plumbingType: (dbListing.plumbingType as string) ?? undefined,
    plumbingStatus: (dbListing.plumbingStatus as string) ?? undefined,
    views: getBoolean(dbListing.views),
    mountainViews: getBoolean(dbListing.mountainViews),
    seaViews: getBoolean(dbListing.seaViews),
    beachfront: getBoolean(dbListing.beachfront),
    jacuzzi: getBoolean(dbListing.jacuzzi),
    hydromassage: getBoolean(dbListing.hydromassage),
    garden: getBoolean(dbListing.garden),
    pool: getBoolean(dbListing.pool),
    homeAutomation: getBoolean(dbListing.homeAutomation),
    musicSystem: getBoolean(dbListing.musicSystem),
    laundryRoom: getBoolean(dbListing.laundryRoom),
    coveredClothesline: getBoolean(dbListing.coveredClothesline),
    fireplace: getBoolean(dbListing.fireplace),
    sauna: getBoolean(dbListing.sauna),
    loadingArea: getBoolean(dbListing.loadingArea),
    patio: getBoolean(dbListing.patio),
    allowedUse: getNumber(dbListing.allowedUse),
    isDiafano: getBoolean(dbListing.isDiafano),
    hasEscaparate: getBoolean(dbListing.hasEscaparate),
    streetType: (dbListing.streetType as string) ?? undefined,
    gym: getBoolean(dbListing.gym),
    sportsArea: getBoolean(dbListing.sportsArea),
    childrenArea: getBoolean(dbListing.childrenArea),
    suiteBathroom: getBoolean(dbListing.suiteBathroom),
    nearbyPublicTransport: getBoolean(dbListing.nearbyPublicTransport),
    communityPool: getBoolean(dbListing.communityPool),
    privatePool: getBoolean(dbListing.privatePool),
    tennisCourt: getBoolean(dbListing.tennisCourt),
    communityArea: getBoolean(dbListing.communityArea),
    internet: getBoolean(dbListing.internet),
    oven: getBoolean(dbListing.oven),
    microwave: getBoolean(dbListing.microwave),
    washingMachine: getBoolean(dbListing.washingMachine),
    secadora: getBoolean(dbListing.secadora),
    fridge: getBoolean(dbListing.fridge),
    tv: getBoolean(dbListing.tv),
    stoneware: getBoolean(dbListing.stoneware),
    description: (dbListing.description as string) ?? undefined,
    shortDescription: (dbListing.shortDescription as string) ?? undefined,
    agent:
      dbListing.agent &&
      typeof dbListing.agent === "object" &&
      dbListing.agent !== null
        ? {
            id: String((dbListing.agent as Record<string, unknown>).id),
            name: `${String((dbListing.agent as Record<string, unknown>).firstName)} ${String((dbListing.agent as Record<string, unknown>).lastName)}`,
          }
        : undefined,
    owners:
      dbListing.owners && Array.isArray(dbListing.owners)
        ? (dbListing.owners as Array<{ id: bigint; name: string }>).map(
            (owner) => ({
              id: Number(owner.id),
              name: owner.name,
            }),
          )
        : undefined,
    deal:
      dbListing.deal && typeof dbListing.deal === "object" && dbListing.deal !== null
        ? {
            dealId: (dbListing.deal as Record<string, unknown>).dealId as number | bigint,
            listingId: (dbListing.deal as Record<string, unknown>).listingId as number | bigint,
            status: ((dbListing.deal as Record<string, unknown>).status as string) ?? "",
            arrasDate:
              (dbListing.deal as Record<string, unknown>).arrasDate instanceof Date
                ? (dbListing.deal as Record<string, unknown>).arrasDate as Date
                : (dbListing.deal as Record<string, unknown>).arrasDate
                  ? new Date((dbListing.deal as Record<string, unknown>).arrasDate as string | number | Date)
                  : null,
            arrasSigningDate:
              (dbListing.deal as Record<string, unknown>).arrasSigningDate instanceof Date
                ? (dbListing.deal as Record<string, unknown>).arrasSigningDate as Date
                : (dbListing.deal as Record<string, unknown>).arrasSigningDate
                  ? new Date((dbListing.deal as Record<string, unknown>).arrasSigningDate as string | number | Date)
                  : null,
            expectedDeedDate:
              (dbListing.deal as Record<string, unknown>).expectedDeedDate instanceof Date
                ? (dbListing.deal as Record<string, unknown>).expectedDeedDate as Date
                : (dbListing.deal as Record<string, unknown>).expectedDeedDate
                  ? new Date((dbListing.deal as Record<string, unknown>).expectedDeedDate as string | number | Date)
                  : null,
            actualDeedDate:
              (dbListing.deal as Record<string, unknown>).actualDeedDate instanceof Date
                ? (dbListing.deal as Record<string, unknown>).actualDeedDate as Date
                : (dbListing.deal as Record<string, unknown>).actualDeedDate
                  ? new Date((dbListing.deal as Record<string, unknown>).actualDeedDate as string | number | Date)
                  : null,
            closeDate:
              (dbListing.deal as Record<string, unknown>).closeDate instanceof Date
                ? (dbListing.deal as Record<string, unknown>).closeDate as Date
                : (dbListing.deal as Record<string, unknown>).closeDate
                  ? new Date((dbListing.deal as Record<string, unknown>).closeDate as string | number | Date)
                  : null,
            keyHandoverDate:
              (dbListing.deal as Record<string, unknown>).keyHandoverDate instanceof Date
                ? (dbListing.deal as Record<string, unknown>).keyHandoverDate as Date
                : (dbListing.deal as Record<string, unknown>).keyHandoverDate
                  ? new Date((dbListing.deal as Record<string, unknown>).keyHandoverDate as string | number | Date)
                  : null,
          }
        : null,
    createdAt: dbListing.createdAt instanceof Date ? dbListing.createdAt : null,
    updatedAt: dbListing.updatedAt instanceof Date ? dbListing.updatedAt : null,
    fichaCompletedAt: dbListing.fichaCompletedAt instanceof Date ? dbListing.fichaCompletedAt : null,
  };
}
