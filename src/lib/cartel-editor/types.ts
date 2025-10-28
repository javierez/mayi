import type { PropertyImage } from "~/lib/data";

// Types for contact data from database
export interface ContactOffice {
  id: string;
  name: string;
  phoneNumbers: {
    main: string;
    sales?: string;
  };
  emailAddresses: {
    info: string;
    sales?: string;
  };
}

export interface ContactProps {
  offices: ContactOffice[];
}

// Props for the main CartelEditorClient component
export interface CartelEditorClientProps {
  images?: PropertyImage[];
  databaseListingType?: "Sale" | "Rent"; // Optional database value
  databasePropertyType?: string; // Optional database property type
  accountColorPalette?: string[]; // Account color palette
  databaseCity?: string; // Optional database city
  databaseNeighborhood?: string; // Optional database neighborhood
  databaseBedrooms?: number; // Optional database bedrooms
  databaseBathrooms?: number; // Optional database bathrooms
  databaseSquareMeter?: number; // Optional database square meters
  databaseContactProps?: string; // Optional database contact props JSON
  databaseWebsite?: string; // Optional database website
  _databaseWatermarkProps?: string; // Optional database watermark props JSON
  databaseLogoUrl?: string; // Optional database logo URL
  accountPreferences?: string; // Optional account preferences JSON
}

// Step component common props
export interface StepComponentProps {
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
}
