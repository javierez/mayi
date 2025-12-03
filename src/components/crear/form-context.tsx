"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// Form data interfaces - centralized definitions
export interface ListingDetails {
  formPosition?: number;
  propertyType?: string;
  propertySubtype?: string;
  propertyId?: number;
  listingType?: string;
  agentId?: number | string;
  price?: number | string;
  [key: string]: unknown;
}

export interface Agent {
  id: string;
  name: string;
}

export interface Contact {
  id: number;
  name: string;
}

// Comprehensive form data interface covering all pages
export interface CompleteFormData {
  // Meta data
  formPosition?: number;

  // Page 1 - Basic Info & IDs
  propertyId?: number | string;
  listingId?: number | string;
  price?: string;
  listingType?: string;
  propertyType?: string;
  propertySubtype?: string;
  agentId?: string;
  selectedContactIds?: string[];
  selectedContacts?: Contact[]; // Store full contact details for display

  // Page 2 - Details
  bedrooms?: number;
  bathrooms?: number;
  totalSurface?: number;
  usefulSurface?: number;
  plotSurface?: number;
  floor?: string;
  totalFloors?: string;
  buildYear?: number | null;
  buildYearUnknown?: boolean;
  renovationYear?: number | null;
  renovationYearUnknown?: boolean;
  isRenovated?: boolean;
  conservationStatus?: number;
  condition?: string;
  energyCertificate?: string;
  emissions?: string;
  cadastralReference?: string;
  isDiafano?: boolean; // Only for 'local' property type - open-plan/open-space commercial
  hasEscaparate?: boolean; // Only for 'local' property type - has shop window/storefront

  // Page 3 - Address
  address?: string;
  addressDetails?: string;
  city?: string;
  province?: string;
  municipality?: string;
  postalCode?: string;
  neighborhood?: string;
  latitude?: number | string;
  longitude?: number | string;
  streetType?: string; // Only for 'local' - traffic intensity: muy_transitada, transitada, moderada, poco_transitada

  // Page 4 - Equipment
  heating?: string;
  airConditioning?: string[];
  hasElevator?: boolean;
  hasGarage?: boolean;
  hasStorageRoom?: boolean;
  hasGarden?: boolean;
  hasSwimmingPool?: boolean;
  hasTerrace?: boolean;
  hasBalcony?: boolean;

  // Page 5 - Orientation & Exposure
  orientation?: string;
  exterior?: boolean;
  bright?: boolean;
  luminosity?: string | string[];

  // Page 6 - Additional
  accessibility?: boolean;
  securitySystem?: boolean;
  doorman?: boolean;
  builtInWardrobes?: boolean;
  videoIntercom?: boolean;
  securityGuard?: boolean;
  vpo?: boolean;
  satelliteDish?: boolean;
  doubleGlazing?: boolean;
  openKitchen?: boolean;
  frenchKitchen?: boolean;
  pantry?: boolean;

  // Page 7 - Luxury & Views
  luxuryFeatures?: string[];
  highEndFinishes?: boolean;
  designerKitchen?: boolean;
  smartHome?: boolean;
  views?: boolean; // Individual views boolean (in addition to string array)
  mountainViews?: boolean;
  seaViews?: boolean;
  beachfront?: boolean;
  jacuzzi?: boolean; // Individual jacuzzi boolean
  hydromassage?: boolean; // Individual hydromassage boolean
  fireplace?: boolean;
  musicSystem?: boolean;
  gym?: boolean;
  sportsArea?: boolean;
  childrenArea?: boolean;
  suiteBathroom?: boolean;
  nearbyPublicTransport?: boolean;
  communityPool?: boolean;
  privatePool?: boolean;
  tennisCourt?: boolean;
  coveredClothesline?: boolean;

  // Page 8 - Spaces & Dimensions
  hasAttic?: boolean;
  hasBasement?: boolean;
  hasLaundryRoom?: boolean;
  hasOffice?: boolean;
  hasDressingRoom?: boolean;
  terraceSize?: number;
  balconyCount?: number;
  galleryCount?: number;
  wineCellar?: boolean;
  wineCellarSize?: number;
  livingRoomSize?: number;

  // Page 9 - Materials & Finishes
  wallMaterial?: string;
  kitchenMaterial?: string;
  bathroomMaterial?: string;
  mainFloorType?: string;
  shutterType?: string;
  carpentryType?: string;
  windowType?: string;

  // Page 10 - Description
  title?: string;
  description?: string;
  highlights?: string[];

  // Page 11 - Rent
  hasKeys?: boolean;
  studentFriendly?: boolean;
  petsAllowed?: boolean;
  appliancesIncluded?: boolean;
  isFurnished?: boolean;
  furnitureQuality?: string;
  optionalGaragePrice?: number;
  optionalStorageRoomPrice?: number;
  rentalPrice?: number;
  duplicateForRent?: boolean;
  internet?: boolean;
}

export interface GlobalFormState {
  // Single source of truth - ALL form data (fetched + user changes)
  formData: CompleteFormData;

  // Supporting data
  agents: Agent[];
  currentContacts: string[];

  // Flags
  hasUnsavedChanges: boolean;
  isLoading: boolean;
}

interface FormContextType {
  state: GlobalFormState;
  updateFormData: (updates: Partial<CompleteFormData>) => void;
  updateField: <K extends keyof CompleteFormData>(
    field: K,
    value: CompleteFormData[K],
  ) => void;
  resetForm: () => void;
  markAsSaved: () => void;
  setLoading: (loading: boolean) => void;
  setInitialData: (data: {
    fetchedFormData?: CompleteFormData;
    agents: Agent[];
    currentContacts: string[];
  }) => void;
  updateAgents: (agents: Agent[]) => void;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function useFormContext(): FormContextType {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
}

interface FormProviderProps {
  children: ReactNode;
}

export function FormProvider({ children }: FormProviderProps) {
  const [state, setState] = useState<GlobalFormState>({
    formData: {}, // Single source of truth for ALL form data
    agents: [],
    currentContacts: [],
    hasUnsavedChanges: false,
    isLoading: true,
  });

  const updateFormData = useCallback((updates: Partial<CompleteFormData>) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, ...updates },
      hasUnsavedChanges: true,
    }));
  }, []);

  const updateField = useCallback(
    <K extends keyof CompleteFormData>(
      field: K,
      value: CompleteFormData[K],
    ) => {
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, [field]: value },
        hasUnsavedChanges: true,
      }));
    },
    [],
  );

  const resetForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      formData: {},
      hasUnsavedChanges: false,
    }));
  }, []);

  const markAsSaved = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasUnsavedChanges: false,
    }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setState((prev) => ({
      ...prev,
      isLoading: loading,
    }));
  }, []);

  const setInitialData = useCallback(
    (data: {
      fetchedFormData?: CompleteFormData;
      agents: Agent[];
      currentContacts: string[];
    }) => {
      setState((prev) => ({
        ...prev,
        agents: data.agents,
        currentContacts: data.currentContacts,
        // Simple: Set the fetched data as our single local working copy
        formData: data.fetchedFormData ?? {},
        hasUnsavedChanges: false,
        isLoading: false,
      }));
    },
    [],
  );

  const updateAgents = useCallback((agents: Agent[]) => {
    setState((prev) => ({
      ...prev,
      agents,
    }));
  }, []);

  const contextValue: FormContextType = {
    state,
    updateFormData,
    updateField,
    resetForm,
    markAsSaved,
    setLoading,
    setInitialData,
    updateAgents,
  };

  return (
    <FormContext.Provider value={contextValue}>{children}</FormContext.Provider>
  );
}
