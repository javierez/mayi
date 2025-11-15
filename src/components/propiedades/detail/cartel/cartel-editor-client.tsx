"use client";

import React, { useState, useRef, useEffect } from "react";

import {
  generateStaticDescription,
  mapDatabaseListingType,
  mapDatabasePropertyType,
  parseContactData,
} from "~/lib/cartel-editor/utils";
import type {
  CartelEditorClientProps,
  ContactOffice,
} from "~/lib/cartel-editor/types";
import { useParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Slider } from "~/components/ui/slider";
import {
  FileText,
  Image as ImageIcon,
  Settings,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { getExtendedDefaultPropertyData } from "~/lib/carteleria/mock-data";
import {
  getTemplateComponent,
  getTemplateStyleName,
} from "~/lib/carteleria/template-resolver";
import type {
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
  SavedCartelConfiguration,
  SaveConfigurationRequest,
} from "~/types/template-data";
import { toast } from "sonner";
import { getTemplateImages } from "~/lib/carteleria/s3-images";
import { CartelImageGallerySection } from "./cartel-image-gallery-section";
import { CartelPreviewPanel } from "./cartel-preview-panel";
import { SaveConfigurationModal } from "./save-configuration-modal";
import { CartelEditorPage1 } from "./cartel-editor-page1";
import { CartelEditorPage2 } from "./cartel-editor-page2";
import { CartelEditorPage3 } from "./cartel-editor-page3";
import { CartelEditorPage4 } from "./cartel-editor-page4";

export function CartelEditorClient({
  images = [],
  databaseListingType,
  databasePropertyType,
  accountColorPalette = [],
  databaseCity,
  databaseNeighborhood,
  databaseBedrooms,
  databaseBathrooms,
  databaseSquareMeter,
  databaseContactProps,
  databaseWebsite,
  _databaseWatermarkProps,
  databaseLogoUrl,
  accountPreferences,
}: CartelEditorClientProps) {
  // Get listing ID from URL
  const params = useParams();
  const listingId = params.id ? parseInt(params.id as string, 10) : null;

  // Debug logging
  console.log("CartelEditorClient - listingId from URL:", listingId);

  // Template configuration state
  const [config, setConfig] = useState<TemplateConfiguration>(() => {
    const mappedListingType = mapDatabaseListingType(databaseListingType);
    const mappedPropertyType = mapDatabasePropertyType(databasePropertyType);
    const resolvedTemplateStyle = getTemplateStyleName(
      accountPreferences,
      "vertical",
    );
    // Extract just the template style part (basic/classic) for TemplateConfiguration
    const baseTemplateStyle = resolvedTemplateStyle.split("-")[0] as
      | "basic"
      | "classic";
    return {
      templateStyle: baseTemplateStyle,
      orientation: "vertical",
      propertyType: mappedPropertyType ?? "piso", // Use DB value or fallback
      listingType: mappedListingType ?? "venta", // Use DB value or fallback
      imageCount: 4,
      twoImageLayout: "vertical",
      showPhone: true,
      showEmail: true,
      showWebsite: false,
      showQR: true,
      showReference: true,
      showWatermark: true,
      showIcons: true,
      showShortDescription: true,
      titleFont: "default",
      priceFont: "default",
      titleAlignment: "left",
      titleSize: 50,
      titleColor: "white",
      titlePositionX: 0,
      titlePositionY: 0,
      locationFont: "default",
      locationAlignment: "left",
      locationSize: 24,
      locationColor: "white",
      locationPositionX: 0,
      locationPositionY: 0,
      locationBorderRadius: 8,
      priceAlignment: "center",
      priceSize: 50,
      priceColor: "#000000",
      pricePositionX: 0,
      pricePositionY: 0,
      contactPositionX: 0,
      contactPositionY: 0,
      contactBackgroundColor: "default",
      contactBorderRadius: 8,
      iconSize: 1.0,
      iconTextGap: 8,
      iconPairGap: 16,
      overlayColor: "default",
      additionalFields: ["hasElevator", "hasGarage"],
      // Description styling defaults
      descriptionFont: "default",
      descriptionAlignment: "left",
      descriptionSize: 16,
      descriptionColor: "#ffffff",
      descriptionPositionX: 0,
      descriptionPositionY: 0,
      // Bullet styling defaults
      bulletFont: "default",
      bulletAlignment: "left",
      bulletSize: 14,
      bulletColor: "#000000",
      bulletPositionX: 0,
      bulletPositionY: 0,
      referenceTextColor: "#000000",
      showEnergyRating: false,
      energyConsumptionScale: "B",
    };
  });

  // Get the appropriate template component based on account preferences and orientation
  // This will update when config.orientation changes
  const TemplateComponent = React.useMemo(
    () => getTemplateComponent(accountPreferences, config.orientation),
    [accountPreferences, config.orientation],
  );

  // Property data state (using mock data as base)
  const [propertyData, setPropertyData] =
    useState<ExtendedTemplatePropertyData>(() => {
      const baseData = getExtendedDefaultPropertyData(config.propertyType);
      // Generate default title - just the property type in uppercase (listing type is handled separately in template)
      const propertyTypeText =
        {
          piso: "PISO",
          casa: "CASA",
          local: "LOCAL",
          garaje: "GARAJE",
          solar: "SOLAR",
        }[config.propertyType] ?? "PROPIEDAD";

      // Use selected images if available
      const selectedImages = images
        .slice(0, 4)
        .map((img) => img.imageUrl)
        .filter(Boolean);

      // Use logo URL directly from database (logo field IS the watermark)
      const logoUrl: string | undefined = databaseLogoUrl;
      console.log("🖼️ Logo URL from database:", logoUrl);

      return {
        ...baseData,
        title: propertyTypeText,
        propertyType: config.propertyType, // Ensure propertyType is explicitly set
        images: selectedImages.length > 0 ? selectedImages : baseData.images,
        logoUrl, // Add logo URL from account preferences
        location: {
          neighborhood: databaseNeighborhood ?? baseData.location.neighborhood,
          city: databaseCity ?? baseData.location.city,
        },
        specs: {
          ...baseData.specs,
          bedrooms: databaseBedrooms ?? baseData.specs.bedrooms,
          bathrooms: databaseBathrooms ?? baseData.specs.bathrooms,
          squareMeters: databaseSquareMeter ?? baseData.specs.squareMeters,
        },
        shortDescription: generateStaticDescription(
          baseData.propertyType,
          databaseNeighborhood ?? baseData.location.neighborhood,
          databaseCity ?? baseData.location.city,
          databaseBedrooms ?? baseData.specs.bedrooms ?? 0,
          databaseBathrooms ?? baseData.specs.bathrooms ?? 0,
          databaseSquareMeter ?? baseData.specs.squareMeters ?? 0,
        ),
        iconListText: `• ${databaseBedrooms ?? baseData.specs.bedrooms ?? 0} dormitorios\n• ${databaseBathrooms ?? baseData.specs.bathrooms ?? 0} baños\n• ${databaseSquareMeter ?? baseData.specs.squareMeters ?? 0} m²`,
      };
    });

  // Location field state - format: "neighborhood (city)"
  const [locationText, setLocationText] = useState(() => {
    const neighborhood = databaseNeighborhood ?? "Salamanca";
    const city = databaseCity ?? "Madrid";
    return `${neighborhood} (${city})`;
  });

  // Contact data state
  const [contactData] = useState<ContactOffice[]>(() => {
    return parseContactData(databaseContactProps);
  });

  // Selected contact options state
  const [selectedPhone, setSelectedPhone] = useState<string>("");
  const [selectedEmail, setSelectedEmail] = useState<string>("");

  // Initialize contact selections when contact data changes
  React.useEffect(() => {
    console.log("🔄 Contact data updated:", contactData);
    if (contactData.length > 0) {
      const firstOffice = contactData[0];
      console.log("🏢 First office:", firstOffice);
      if (!selectedPhone && firstOffice?.phoneNumbers?.main) {
        console.log("📞 Setting phone:", firstOffice.phoneNumbers.main);
        setSelectedPhone(firstOffice.phoneNumbers.main);
      }
      if (!selectedEmail && firstOffice?.emailAddresses?.info) {
        console.log("📧 Setting email:", firstOffice.emailAddresses.info);
        setSelectedEmail(firstOffice.emailAddresses.info);
      }
    }
  }, [contactData, selectedPhone, selectedEmail]);

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview] = useState(true);
  const [lastGeneratedPdf, setLastGeneratedPdf] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(0.4); // Default zoom level
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Selected images for cartel (using indices instead of URLs)
  // Auto-select first 1-4 images on load
  const [selectedImageIndices, setSelectedImageIndices] = useState<number[]>(
    () => {
      // Auto-select first 1-4 images (minimum 1, maximum 4)
      const minImages = 1;
      const maxImages = 4;
      const availableImages = images.length;

      if (availableImages >= minImages) {
        const imageCount = Math.min(availableImages, maxImages);
        return images.slice(0, imageCount).map((_, index) => index);
      }

      // If no images available, return empty array
      return [];
    },
  );

  // Track if user has manually changed image selection
  const hasUserInteractedWithSelection = useRef(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = 3;

  // Title customization toggle state
  const [showTitleCustomization, setShowTitleCustomization] = useState(false);

  // Location customization toggle state
  const [showLocationCustomization, setShowLocationCustomization] =
    useState(false);

  // Price customization toggle state
  const [showPriceCustomization, setShowPriceCustomization] = useState(false);

  // Contact customization toggle state
  const [showContactCustomization, setShowContactCustomization] =
    useState(false);

  // Page navigation state
  const [currentPage, setCurrentPage] = useState<1 | 2 | 3 | 4>(1);

  // Configuration management state
  const [savedConfigurations, setSavedConfigurations] = useState<
    SavedCartelConfiguration[]
  >([]);
  const [currentConfigurationId, setCurrentConfigurationId] = useState<
    string | null
  >(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isLoadingConfigurations, setIsLoadingConfigurations] = useState(false);

  // Cartel save state
  const [isSavingCartel, setIsSavingCartel] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  // Get template images for positioning controls - use selected images or fallback to default S3 images
  const templateImages =
    selectedImageIndices.length > 0
      ? (selectedImageIndices
          .slice(0, config.imageCount)
          .map((index) => images[index]?.imageUrl)
          .filter(Boolean) as string[])
      : getTemplateImages(config.imageCount);

  // Debug logging
  React.useEffect(() => {
    console.log("🖼️ Template Images Debug:", {
      totalImages: images.length,
      selectedIndices: selectedImageIndices,
      templateImages,
      imageCount: config.imageCount,
    });
  }, [images, selectedImageIndices, templateImages, config.imageCount]);

  // Update selected images when images prop changes (after server-side load)
  // Only auto-select if user hasn't manually changed the selection
  React.useEffect(() => {
    if (
      images.length > 0 &&
      selectedImageIndices.length === 0 &&
      !hasUserInteractedWithSelection.current
    ) {
      const minImages = 1;
      const maxImages = 4;
      const availableImages = images.length;

      if (availableImages >= minImages) {
        const imageCount = Math.min(availableImages, maxImages);
        setSelectedImageIndices(
          images.slice(0, imageCount).map((_, index) => index),
        );
      } else {
        setSelectedImageIndices(images.map((_, index) => index));
      }
    }
  }, [images, selectedImageIndices.length]);

  // Update imageCount based on selected images (1-4)
  React.useEffect(() => {
    const selectedCount = selectedImageIndices.length;
    if (selectedCount >= 1 && selectedCount <= 4) {
      // Map 1-2 images to 2, 3-4 images to their actual count
      const imageCount = selectedCount <= 2 ? 2 : selectedCount;
      updateConfig({ imageCount: imageCount as 2 | 3 | 4 });
    }
  }, [selectedImageIndices]);

  // Parse location text and update property data
  const parseLocationText = (locationText: string) => {
    const match = /^(.*?)\s*\((.*?)\)$/.exec(locationText);
    if (match) {
      const [, neighborhood, city] = match;
      return {
        neighborhood: neighborhood?.trim() ?? "",
        city: city?.trim() ?? "",
      };
    }
    // Fallback if format doesn't match
    return {
      neighborhood: locationText.trim(),
      city: "Madrid",
    };
  };

  // Update property data when location text changes
  React.useEffect(() => {
    const { neighborhood, city } = parseLocationText(locationText);
    updatePropertyData({
      location: { neighborhood, city },
    });
  }, [locationText]);

  // Update property data when contact selections change
  React.useEffect(() => {
    updatePropertyData({
      contact: {
        phone: selectedPhone,
        email: selectedEmail,
        website: databaseWebsite ?? undefined,
      },
    });
  }, [selectedPhone, selectedEmail, databaseWebsite]);

  // Handle configuration updates
  const updateConfig = (updates: Partial<TemplateConfiguration>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };

      // If switching to basic template, ensure only 2 contact elements max
      if (updates.templateStyle === "basic") {
        const contactElements = [
          { key: "showPhone" as const, value: newConfig.showPhone },
          { key: "showEmail" as const, value: newConfig.showEmail },
          { key: "showWebsite" as const, value: newConfig.showWebsite },
        ].filter((el) => el.value);

        // If more than 2 contact elements are selected, keep only the first 2
        if (contactElements.length > 2) {
          const elementsToRemove = contactElements.slice(2);

          elementsToRemove.forEach((el) => {
            newConfig[el.key] = false;
          });
        }
      }

      return newConfig;
    });
  };

  // Handle property data updates
  const updatePropertyData = (
    updates: Partial<ExtendedTemplatePropertyData>,
  ) => {
    setPropertyData((prev) => ({
      ...prev,
      ...updates,
      location: {
        ...prev.location,
        ...(updates.location ?? {}),
      },
      specs: {
        ...prev.specs,
        ...(updates.specs ?? {}),
      },
      contact: {
        ...prev.contact,
        ...(updates.contact ?? {}),
      },
    }));
  };

  // Handle image positioning updates
  const updateImagePosition = (imageUrl: string, x: number, y: number) => {
    setPropertyData((prev) => ({
      ...prev,
      imagePositions: {
        ...prev.imagePositions,
        [imageUrl]: {
          ...prev.imagePositions?.[imageUrl],
          x,
          y,
        },
      },
    }));
  };

  // Handle image zoom updates
  const updateImageZoom = (imageUrl: string, zoom: number) => {
    setPropertyData((prev) => ({
      ...prev,
      imagePositions: {
        ...prev.imagePositions,
        [imageUrl]: {
          x: prev.imagePositions?.[imageUrl]?.x ?? 50,
          y: prev.imagePositions?.[imageUrl]?.y ?? 50,
          zoom: Math.max(0.5, Math.min(3.0, zoom)), // Clamp between 0.5x and 3.0x
        },
      },
    }));
  };

  // Zoom control functions
  const zoomIn = () => setPreviewZoom((prev) => Math.min(prev + 0.1, 1.0));
  const zoomOut = () => setPreviewZoom((prev) => Math.max(prev - 0.1, 0.2));
  const resetZoom = () => {
    setPreviewZoom(config.orientation === "vertical" ? 0.4 : 0.35);
    setPanX(0);
    setPanY(0);
  };


  // Drag start handler
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    e.preventDefault();
  };

  // Add global mouse event listeners for dragging
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;

      setPanX(newPanX);
      setPanY(newPanY);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, dragStart.x, dragStart.y]);

  // Generate PDF using Puppeteer
  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      console.log("🚀 Starting PDF generation...");

      const response = await fetch("/api/puppet/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateConfig: config,
          propertyData: {
            ...propertyData,
            images: templateImages,
          },
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "PDF generation failed");
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();

      // Create download link
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setLastGeneratedPdf(pdfUrl);

      // Automatically download the PDF
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `property-template-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("PDF generado exitosamente!");
      console.log("✅ PDF generated and downloaded");
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      toast.error(
        `Error al generar PDF: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Save cartel as document to database and S3
  const saveCartelAsDocument = async () => {
    if (!listingId) {
      toast.error("No se puede guardar: ID de listing no disponible");
      return;
    }

    setIsSavingCartel(true);
    try {
      console.log("🚀 Starting cartel save process...");

      // Generate PDF and save directly to S3 (server-side)
      const response = await fetch("/api/puppet/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateConfig: config,
          propertyData: {
            ...propertyData,
            images: templateImages,
          },
          saveToS3: true,
          listingId: listingId.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "PDF generation and save failed");
      }

      // Handle JSON response (PDF was saved server-side)
      const result = (await response.json()) as {
        success: boolean;
        documentUrl: string;
        filename: string;
        documentId: string;
      };

      if (!result.success) {
        throw new Error("Failed to save PDF");
      }

      toast.success("Cartel guardado exitosamente en documentos!");
      console.log("✅ Cartel saved successfully:", {
        documentId: result.documentId,
        filename: result.filename,
      });
    } catch (error) {
      console.error("❌ Cartel save error:", error);
      toast.error(
        `Error al guardar cartel: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    } finally {
      setIsSavingCartel(false);
    }
  };

  // Preview the template in a new window
  const previewTemplate = () => {
    const templateUrl = new URL("/api/puppet/template", window.location.origin);
    templateUrl.searchParams.set("config", JSON.stringify(config));
    templateUrl.searchParams.set(
      "data",
      JSON.stringify({
        ...propertyData,
        images: templateImages,
      }),
    );

    window.open(
      templateUrl.toString(),
      "_blank",
      "width=820,height=1160,scrollbars=yes,resizable=yes",
    );
  };

  // Configuration management functions
  const fetchConfigurations = async () => {
    setIsLoadingConfigurations(true);
    try {
      const response = await fetch("/api/cartel-configurations");
      const data = (await response.json()) as {
        success: boolean;
        data?: SavedCartelConfiguration[];
        error?: string;
      };

      if (data.success) {
        setSavedConfigurations(data.data ?? []);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    } finally {
      setIsLoadingConfigurations(false);
    }
  };

  const saveConfiguration = async (
    request: SaveConfigurationRequest,
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/cartel-configurations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      const data = (await response.json()) as {
        success: boolean;
        data?: SavedCartelConfiguration;
        error?: string;
      };

      if (data.success) {
        await fetchConfigurations(); // Refresh the list
        setCurrentConfigurationId(data.data?.id ?? null);
        setHasUnsavedChanges(false);
        return true;
      } else {
        toast.error(data.error ?? "Error al guardar la configuración");
        return false;
      }
    } catch (error) {
      console.error("Error saving configuration:", error);
      toast.error("Error al guardar la configuración");
      return false;
    }
  };

  const loadConfiguration = (configuration: SavedCartelConfiguration) => {
    try {
      setConfig(configuration.templateConfig);

      // Apply property overrides if any
      if (configuration.propertyOverrides) {
        setPropertyData((prev) => ({
          ...prev,
          ...configuration.propertyOverrides,
        }));
      }

      // Apply selected contacts
      if (configuration.selectedContacts?.phone) {
        setSelectedPhone(configuration.selectedContacts.phone);
      }
      if (configuration.selectedContacts?.email) {
        setSelectedEmail(configuration.selectedContacts.email);
      }

      // Apply selected image indices
      setSelectedImageIndices(configuration.selectedImageIndices);

      setCurrentConfigurationId(configuration.id);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Error loading configuration:", error);
      toast.error("Error al cargar la configuración");
    }
  };

  // Load configurations on component mount
  useEffect(() => {
    void fetchConfigurations();
  }, []);

  // Track changes to detect unsaved modifications
  useEffect(() => {
    if (currentConfigurationId) {
      const currentConfig = savedConfigurations.find(
        (c) => c.id === currentConfigurationId,
      );
      if (currentConfig) {
        const hasConfigChanges =
          JSON.stringify(config) !==
          JSON.stringify(currentConfig.templateConfig);
        const hasContactChanges =
          selectedPhone !== (currentConfig.selectedContacts?.phone ?? "") ||
          selectedEmail !== (currentConfig.selectedContacts?.email ?? "");
        const hasImageChanges =
          JSON.stringify(selectedImageIndices) !==
          JSON.stringify(currentConfig.selectedImageIndices);

        setHasUnsavedChanges(
          hasConfigChanges || hasContactChanges || hasImageChanges,
        );
      }
    } else {
      setHasUnsavedChanges(false);
    }
  }, [
    config,
    selectedPhone,
    selectedEmail,
    selectedImageIndices,
    currentConfigurationId,
    savedConfigurations,
  ]);

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle image selection changes and mark user interaction
  const handleImageSelectionChange = (indices: number[]) => {
    hasUserInteractedWithSelection.current = true;
    setSelectedImageIndices(indices);
  };

  return (
    <div className="w-full p-4 md:p-6">
      {/* Image Selection Section */}
      <CartelImageGallerySection
        images={images}
        selectedIndices={selectedImageIndices}
        onSelectionChange={handleImageSelectionChange}
      />

      <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="space-y-4 md:space-y-6 lg:col-span-1">
          {/* Step 1: Configuration */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {currentPage === 1 && (
                    <>
                      <Settings className="h-5 w-5" />
                      <span className="mr-1">1.</span>
                      Configuración
                    </>
                  )}
                  {currentPage === 2 && (
                    <>
                      <FileText className="h-5 w-5" />
                      <span className="mr-1">2.</span>
                      Contenido
                    </>
                  )}
                  {currentPage === 3 && (
                    <>
                      <Palette className="h-5 w-5" />
                      <span className="mr-1">3.</span>
                      Personalización
                    </>
                  )}
                  {currentPage === 4 && (
                    <>
                      <ImageIcon className="h-5 w-5" />
                      <span className="mr-1">4.</span>
                      Imágenes
                    </>
                  )}
                </CardTitle>
                <CardDescription>
                  {currentPage === 1 && "Configura el diseño básico de la plantilla"}
                  {currentPage === 2 && "Gestiona el contenido del cartel"}
                  {currentPage === 3 && "Personaliza el estilo visual del cartel"}
                  {currentPage === 4 && "Selecciona y organiza las imágenes"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Page Content */}
                {currentPage === 1 && (
                  <CartelEditorPage1
                    config={config}
                    updateConfig={updateConfig}
                    accountColorPalette={accountColorPalette}
                    onNext={() => setCurrentPage(2)}
                  />
                )}

                {currentPage === 2 && (
                  <CartelEditorPage2
                    config={config}
                    updateConfig={updateConfig}
                    propertyData={propertyData}
                    updatePropertyData={updatePropertyData}
                    onPrevious={() => setCurrentPage(1)}
                    onNext={() => setCurrentPage(3)}
                  />
                )}

                {currentPage === 3 && (
                  <CartelEditorPage3
                    config={config}
                    updateConfig={updateConfig}
                    propertyData={propertyData}
                    updatePropertyData={updatePropertyData}
                    locationText={locationText}
                    setLocationText={setLocationText}
                    accountColorPalette={accountColorPalette}
                    onPrevious={() => setCurrentPage(2)}
                    onNext={() => setCurrentPage(4)}
                  />
                )}

                {currentPage === 4 && (
                  <CartelEditorPage4
                    config={config}
                    updateConfig={updateConfig}
                    propertyData={propertyData}
                    templateImages={templateImages}
                    updateImagePosition={updateImagePosition}
                    updateImageZoom={updateImageZoom}
                    onPrevious={() => setCurrentPage(3)}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Property Data */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <span className="mr-1">2.</span>
                  Propiedad
                </CardTitle>
                <CardDescription>
                  Edita la información de la propiedad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        value={propertyData.title}
                        onChange={(e) =>
                          updatePropertyData({ title: e.target.value })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowTitleCustomization(!showTitleCustomization)
                      }
                      className="group mt-6 rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
                      title="Personalizar título"
                    >
                      <div
                        className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showTitleCustomization ? "rotate-180" : "rotate-0"} `}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                  </div>

                  {showTitleCustomization && (
                    <div className="space-y-4 rounded-lg bg-gray-50 p-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Font Style */}
                          <div>
                            <Label htmlFor="titleFont">Fuente</Label>
                            <Select
                              value={config.titleFont}
                              onValueChange={(
                                value:
                                  | "default"
                                  | "serif"
                                  | "sans"
                                  | "mono"
                                  | "elegant"
                                  | "modern",
                              ) => updateConfig({ titleFont: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">
                                  Por defecto
                                </SelectItem>
                                <SelectItem
                                  value="serif"
                                  style={{ fontFamily: "serif" }}
                                >
                                  Serif
                                </SelectItem>
                                <SelectItem
                                  value="sans"
                                  style={{ fontFamily: "sans-serif" }}
                                >
                                  Sans
                                </SelectItem>
                                <SelectItem
                                  value="mono"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  Mono
                                </SelectItem>
                                <SelectItem
                                  value="elegant"
                                  style={{ fontFamily: "Times, serif" }}
                                >
                                  Elegant
                                </SelectItem>
                                <SelectItem
                                  value="modern"
                                  style={{ fontFamily: "Arial, sans-serif" }}
                                >
                                  Modern
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Text Color */}
                          <div>
                            <Label htmlFor="titleColor">Color del texto</Label>
                            <div className="flex justify-end">
                              <Select
                                value={config.titleColor}
                                onValueChange={(value) =>
                                  updateConfig({ titleColor: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Default Colors */}
                                  <SelectItem value="white">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full border border-gray-300 bg-white"></div>
                                      Blanco
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="black">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full bg-black"></div>
                                      Negro
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="gray">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                      Gris
                                    </div>
                                  </SelectItem>
                                  {/* Corporate Colors */}
                                  {accountColorPalette.length > 0 && (
                                    <>
                                      {accountColorPalette.map(
                                        (color, index) => (
                                          <SelectItem key={color} value={color}>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="h-3 w-3 rounded-full border border-gray-300"
                                                style={{
                                                  backgroundColor: color,
                                                }}
                                              ></div>
                                              Corporativo {index + 1}
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Text Alignment */}
                          <div>
                            <Label>Alineación</Label>
                            <div className="mt-1 flex gap-1">
                              <Button
                                variant={
                                  config.titleAlignment === "left"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ titleAlignment: "left" })
                                }
                                className="p-2"
                              >
                                <AlignLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={
                                  config.titleAlignment === "center"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ titleAlignment: "center" })
                                }
                                className="p-2"
                              >
                                <AlignCenter className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={
                                  config.titleAlignment === "right"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ titleAlignment: "right" })
                                }
                                className="p-2"
                              >
                                <AlignRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Text Size */}
                          <div>
                            <Label>Tamaño</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs">A</span>
                              <Slider
                                value={[config.titleSize]}
                                onValueChange={([value]) =>
                                  updateConfig({ titleSize: value })
                                }
                                max={60}
                                min={16}
                                step={2}
                                className="flex-1"
                              />
                              <span className="text-lg font-bold">A</span>
                            </div>
                          </div>
                        </div>

                        {/* Position Controls */}
                        <div>
                          <Label className="text-sm text-gray-600">
                            Posición
                          </Label>
                          <div className="mt-2 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              {/* Up Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mb-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    titlePositionY: Math.max(
                                      (config.titlePositionY || 0) - 5,
                                      -30,
                                    ),
                                  })
                                }
                                disabled={(config.titlePositionY || 0) <= -30}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>

                              <div className="flex items-center gap-0.5">
                                {/* Left Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      titlePositionX: Math.max(
                                        (config.titlePositionX || 0) - 5,
                                        -50,
                                      ),
                                    })
                                  }
                                  disabled={(config.titlePositionX || 0) <= -50}
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>

                                {/* Center/Reset Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 rounded-full p-0"
                                  onClick={() =>
                                    updateConfig({
                                      titlePositionX: 0,
                                      titlePositionY: 0,
                                    })
                                  }
                                >
                                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                </Button>

                                {/* Right Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      titlePositionX: Math.min(
                                        (config.titlePositionX || 0) + 5,
                                        50,
                                      ),
                                    })
                                  }
                                  disabled={(config.titlePositionX || 0) >= 50}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Down Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    titlePositionY: Math.min(
                                      (config.titlePositionY || 0) + 5,
                                      30,
                                    ),
                                  })
                                }
                                disabled={(config.titlePositionY || 0) >= 30}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Section */}
                <div>
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={locationText}
                        onChange={(e) => setLocationText(e.target.value)}
                        placeholder="Barrio (Ciudad)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowLocationCustomization(!showLocationCustomization)
                      }
                      className="group mt-6 rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
                      title="Personalizar ubicación"
                    >
                      <div
                        className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showLocationCustomization ? "rotate-180" : "rotate-0"} `}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                  </div>

                  {showLocationCustomization && (
                    <div className="mt-3 space-y-4 rounded-lg bg-gray-50 p-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Font Style */}
                          <div>
                            <Label htmlFor="locationFont">Fuente</Label>
                            <Select
                              value={config.locationFont}
                              onValueChange={(
                                value:
                                  | "default"
                                  | "serif"
                                  | "sans"
                                  | "mono"
                                  | "elegant"
                                  | "modern",
                              ) => updateConfig({ locationFont: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">
                                  Por defecto
                                </SelectItem>
                                <SelectItem
                                  value="serif"
                                  style={{ fontFamily: "serif" }}
                                >
                                  Serif
                                </SelectItem>
                                <SelectItem
                                  value="sans"
                                  style={{ fontFamily: "sans-serif" }}
                                >
                                  Sans
                                </SelectItem>
                                <SelectItem
                                  value="mono"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  Mono
                                </SelectItem>
                                <SelectItem
                                  value="elegant"
                                  style={{ fontFamily: "Times, serif" }}
                                >
                                  Elegant
                                </SelectItem>
                                <SelectItem
                                  value="modern"
                                  style={{ fontFamily: "Arial, sans-serif" }}
                                >
                                  Modern
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Text Color */}
                          <div>
                            <Label htmlFor="locationColor">
                              Color del texto
                            </Label>
                            <div className="flex justify-end">
                              <Select
                                value={config.locationColor}
                                onValueChange={(value) =>
                                  updateConfig({ locationColor: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Default Colors */}
                                  <SelectItem value="white">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full border border-gray-300 bg-white"></div>
                                      Blanco
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="black">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full bg-black"></div>
                                      Negro
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="gray">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                      Gris
                                    </div>
                                  </SelectItem>
                                  {/* Corporate Colors */}
                                  {accountColorPalette.length > 0 && (
                                    <>
                                      {accountColorPalette.map(
                                        (color, index) => (
                                          <SelectItem key={color} value={color}>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="h-3 w-3 rounded-full border border-gray-300"
                                                style={{
                                                  backgroundColor: color,
                                                }}
                                              ></div>
                                              Corporativo {index + 1}
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Text Alignment */}
                          <div>
                            <Label>Alineación</Label>
                            <div className="mt-1 flex gap-1">
                              <Button
                                variant={
                                  config.locationAlignment === "left"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ locationAlignment: "left" })
                                }
                                className="p-2"
                              >
                                <AlignLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={
                                  config.locationAlignment === "center"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ locationAlignment: "center" })
                                }
                                className="p-2"
                              >
                                <AlignCenter className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={
                                  config.locationAlignment === "right"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ locationAlignment: "right" })
                                }
                                className="p-2"
                              >
                                <AlignRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Text Size */}
                          <div>
                            <Label>Tamaño</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs">A</span>
                              <Slider
                                value={[config.locationSize]}
                                onValueChange={([value]) =>
                                  updateConfig({ locationSize: value })
                                }
                                max={32}
                                min={16}
                                step={2}
                                className="flex-1"
                              />
                              <span className="text-lg font-bold">A</span>
                            </div>
                          </div>
                        </div>

                        {/* Position Controls */}
                        <div>
                          <Label className="text-sm text-gray-600">
                            Posición
                          </Label>
                          <div className="mt-2 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              {/* Up Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mb-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    locationPositionY: Math.max(
                                      (config.locationPositionY || 0) - 5,
                                      -30,
                                    ),
                                  })
                                }
                                disabled={
                                  (config.locationPositionY || 0) <= -30
                                }
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>

                              <div className="flex items-center gap-0.5">
                                {/* Left Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      locationPositionX: Math.max(
                                        (config.locationPositionX || 0) - 5,
                                        -50,
                                      ),
                                    })
                                  }
                                  disabled={
                                    (config.locationPositionX || 0) <= -50
                                  }
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>

                                {/* Center/Reset Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 rounded-full p-0"
                                  onClick={() =>
                                    updateConfig({
                                      locationPositionX: 0,
                                      locationPositionY: 0,
                                    })
                                  }
                                >
                                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                </Button>

                                {/* Right Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      locationPositionX: Math.min(
                                        (config.locationPositionX || 0) + 5,
                                        50,
                                      ),
                                    })
                                  }
                                  disabled={
                                    (config.locationPositionX || 0) >= 50
                                  }
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Down Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    locationPositionY: Math.min(
                                      (config.locationPositionY || 0) + 5,
                                      30,
                                    ),
                                  })
                                }
                                disabled={(config.locationPositionY || 0) >= 30}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Border Radius Control - Only show for classic template */}
                        {config.templateStyle !== "basic" && (
                          <div>
                            <Label className="text-sm text-gray-600">
                              Esquinas redondeadas
                            </Label>
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs">◼</span>
                              <Slider
                                value={[config.locationBorderRadius]}
                                onValueChange={([value]) =>
                                  updateConfig({ locationBorderRadius: value })
                                }
                                max={20}
                                min={0}
                                step={2}
                                className="flex-1"
                              />
                              <span className="text-xs">◯</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Section */}
                <div>
                  <div className="flex items-end gap-1">
                    <div className="flex-1">
                      <Label htmlFor="price">Precio (€)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={propertyData.price}
                        onChange={(e) =>
                          updatePropertyData({
                            price: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setShowPriceCustomization(!showPriceCustomization)
                      }
                      className="group mt-6 rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
                      title="Personalizar precio"
                    >
                      <div
                        className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showPriceCustomization ? "rotate-180" : "rotate-0"} `}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                  </div>

                  {showPriceCustomization && (
                    <div className="mt-3 space-y-4 rounded-lg bg-gray-50 p-3">
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Font Style */}
                          <div>
                            <Label htmlFor="priceFont">Fuente</Label>
                            <Select
                              value={config.priceFont}
                              onValueChange={(
                                value:
                                  | "default"
                                  | "serif"
                                  | "sans"
                                  | "mono"
                                  | "elegant"
                                  | "modern",
                              ) => updateConfig({ priceFont: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">
                                  Por defecto
                                </SelectItem>
                                <SelectItem
                                  value="serif"
                                  style={{ fontFamily: "serif" }}
                                >
                                  Serif
                                </SelectItem>
                                <SelectItem
                                  value="sans"
                                  style={{ fontFamily: "sans-serif" }}
                                >
                                  Sans
                                </SelectItem>
                                <SelectItem
                                  value="mono"
                                  style={{ fontFamily: "monospace" }}
                                >
                                  Mono
                                </SelectItem>
                                <SelectItem
                                  value="elegant"
                                  style={{ fontFamily: "Times, serif" }}
                                >
                                  Elegant
                                </SelectItem>
                                <SelectItem
                                  value="modern"
                                  style={{ fontFamily: "Arial, sans-serif" }}
                                >
                                  Modern
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Text Color */}
                          <div>
                            <Label htmlFor="priceColor">Color del texto</Label>
                            <div className="flex justify-end">
                              <Select
                                value={config.priceColor}
                                onValueChange={(value) =>
                                  updateConfig({ priceColor: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Default Colors */}
                                  <SelectItem value="white">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full border border-gray-300 bg-white"></div>
                                      Blanco
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="black">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full bg-black"></div>
                                      Negro
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="gray">
                                    <div className="flex items-center gap-2">
                                      <div className="h-3 w-3 rounded-full bg-gray-500"></div>
                                      Gris
                                    </div>
                                  </SelectItem>
                                  {/* Corporate Colors */}
                                  {accountColorPalette.length > 0 && (
                                    <>
                                      {accountColorPalette.map(
                                        (color, index) => (
                                          <SelectItem key={color} value={color}>
                                            <div className="flex items-center gap-2">
                                              <div
                                                className="h-3 w-3 rounded-full border border-gray-300"
                                                style={{
                                                  backgroundColor: color,
                                                }}
                                              ></div>
                                              Corporativo {index + 1}
                                            </div>
                                          </SelectItem>
                                        ),
                                      )}
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {/* Text Alignment */}
                          <div>
                            <Label>Alineación</Label>
                            <div className="mt-1 flex gap-1">
                              <Button
                                variant={
                                  config.priceAlignment === "left"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ priceAlignment: "left" })
                                }
                                className="p-2"
                              >
                                <AlignLeft className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={
                                  config.priceAlignment === "center"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ priceAlignment: "center" })
                                }
                                className="p-2"
                              >
                                <AlignCenter className="h-3 w-3" />
                              </Button>
                              <Button
                                variant={
                                  config.priceAlignment === "right"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  updateConfig({ priceAlignment: "right" })
                                }
                                className="p-2"
                              >
                                <AlignRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Text Size */}
                          <div>
                            <Label>Tamaño</Label>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="text-xs">A</span>
                              <Slider
                                value={[config.priceSize]}
                                onValueChange={([value]) =>
                                  updateConfig({ priceSize: value })
                                }
                                max={80}
                                min={24}
                                step={4}
                                className="flex-1"
                              />
                              <span className="text-lg font-bold">A</span>
                            </div>
                          </div>
                        </div>

                        {/* Position Controls */}
                        <div>
                          <Label className="text-sm text-gray-600">
                            Posición
                          </Label>
                          <div className="mt-2 flex items-center justify-center">
                            <div className="flex flex-col items-center">
                              {/* Up Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mb-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    pricePositionY: Math.max(
                                      (config.pricePositionY || 0) - 5,
                                      -30,
                                    ),
                                  })
                                }
                                disabled={(config.pricePositionY || 0) <= -30}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>

                              <div className="flex items-center gap-0.5">
                                {/* Left Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      pricePositionX: Math.max(
                                        (config.pricePositionX || 0) - 5,
                                        -50,
                                      ),
                                    })
                                  }
                                  disabled={(config.pricePositionX || 0) <= -50}
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>

                                {/* Center/Reset Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 rounded-full p-0"
                                  onClick={() =>
                                    updateConfig({
                                      pricePositionX: 0,
                                      pricePositionY: 0,
                                    })
                                  }
                                >
                                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                </Button>

                                {/* Right Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      pricePositionX: Math.min(
                                        (config.pricePositionX || 0) + 5,
                                        50,
                                      ),
                                    })
                                  }
                                  disabled={(config.pricePositionX || 0) >= 50}
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Down Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    pricePositionY: Math.min(
                                      (config.pricePositionY || 0) + 5,
                                      30,
                                    ),
                                  })
                                }
                                disabled={(config.pricePositionY || 0) >= 30}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Information from Database */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">
                      Información de Contacto
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        setShowContactCustomization(!showContactCustomization)
                      }
                      className="group rounded-md p-2 transition-colors duration-150 hover:bg-gray-100"
                      title="Personalizar información de contacto"
                    >
                      <div
                        className={`text-gray-400 transition-transform duration-200 group-hover:text-gray-600 ${showContactCustomization ? "rotate-180" : "rotate-0"} `}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </button>
                  </div>

                  {contactData.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {/* Phone Selector */}
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Select
                          value={selectedPhone}
                          onValueChange={setSelectedPhone}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar teléfono" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactData.map((office) => (
                              <React.Fragment key={office.id}>
                                {office.phoneNumbers?.main && (
                                  <SelectItem value={office.phoneNumbers.main}>
                                    {office.phoneNumbers.main}
                                  </SelectItem>
                                )}
                                {office.phoneNumbers?.sales && (
                                  <SelectItem value={office.phoneNumbers.sales}>
                                    {office.phoneNumbers.sales}
                                  </SelectItem>
                                )}
                              </React.Fragment>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Email Selector */}
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Select
                          value={selectedEmail}
                          onValueChange={setSelectedEmail}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar email" />
                          </SelectTrigger>
                          <SelectContent>
                            {contactData.map((office) => (
                              <React.Fragment key={office.id}>
                                {office.emailAddresses?.info && (
                                  <SelectItem
                                    value={office.emailAddresses.info}
                                  >
                                    {office.name}
                                  </SelectItem>
                                )}
                                {office.emailAddresses?.sales && (
                                  <SelectItem
                                    value={office.emailAddresses.sales}
                                  >
                                    {office.name}
                                  </SelectItem>
                                )}
                              </React.Fragment>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Website Display */}
                      {databaseWebsite && (
                        <div>
                          <Label>Website</Label>
                          <Input
                            value={databaseWebsite}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                      <p>
                        No se encontró información de contacto en la
                        configuración del sitio web.
                      </p>
                      <p className="mt-1 text-xs">
                        Configura los datos de contacto en la sección de
                        configuración del sitio web.
                      </p>
                    </div>
                  )}

                  {/* Contact Customization Controls */}
                  {showContactCustomization && (
                    <div className="mt-3 space-y-4 rounded-lg bg-gray-50 p-3">
                      <div className="space-y-3">
                        {/* Background Color */}
                        <div>
                          <Label>Color de Fondo</Label>
                          <Select
                            value={config.contactBackgroundColor}
                            onValueChange={(value) =>
                              updateConfig({ contactBackgroundColor: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {/* Default Colors */}
                              <SelectItem value="default">
                                <div className="flex items-center gap-2">
                                  <div className="h-3 w-3 rounded-full bg-gray-600"></div>
                                  <span>Gris Oscuro</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="white">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: "white" }}
                                  />
                                  <span>Blanco</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="black">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: "black" }}
                                  />
                                  <span>Negro</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="gray">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: "#6B7280" }}
                                  />
                                  <span>Gris</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: "#E5E7EB" }}
                                  />
                                  <span>Claro</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full border border-gray-300"
                                    style={{ backgroundColor: "#1F2937" }}
                                  />
                                  <span>Oscuro</span>
                                </div>
                              </SelectItem>

                              {/* Account color palette */}
                              {accountColorPalette.length > 0 &&
                                accountColorPalette.map((color, index) => (
                                  <SelectItem key={color} value={color}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-3 w-3 rounded-full border border-gray-300"
                                        style={{ backgroundColor: color }}
                                      />
                                      <span>Color {index + 1}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Border Radius */}
                        <div>
                          <Label>Esquinas Redondeadas</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs">0</span>
                            <Slider
                              value={[config.contactBorderRadius]}
                              onValueChange={([value]) =>
                                updateConfig({ contactBorderRadius: value })
                              }
                              max={20}
                              min={0}
                              step={1}
                              className="flex-1"
                            />
                            <span className="text-xs">20</span>
                          </div>
                        </div>

                        {/* Position Controls */}
                        <div>
                          <Label>Posición</Label>
                          <div className="mt-2 flex justify-center">
                            <div className="flex flex-col items-center">
                              {/* Up Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mb-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    contactPositionY: Math.max(
                                      (config.contactPositionY || 0) - 5,
                                      -30,
                                    ),
                                  })
                                }
                                disabled={(config.contactPositionY || 0) <= -30}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>

                              <div className="flex items-center gap-0.5">
                                {/* Left Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      contactPositionX: Math.max(
                                        (config.contactPositionX || 0) - 5,
                                        -50,
                                      ),
                                    })
                                  }
                                  disabled={
                                    (config.contactPositionX || 0) <= -50
                                  }
                                >
                                  <ChevronLeft className="h-3 w-3" />
                                </Button>

                                {/* Center/Reset Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 rounded-full p-0"
                                  onClick={() =>
                                    updateConfig({
                                      contactPositionX: 0,
                                      contactPositionY: 0,
                                    })
                                  }
                                >
                                  <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                                </Button>

                                {/* Right Arrow */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() =>
                                    updateConfig({
                                      contactPositionX: Math.min(
                                        (config.contactPositionX || 0) + 5,
                                        50,
                                      ),
                                    })
                                  }
                                  disabled={
                                    (config.contactPositionX || 0) >= 50
                                  }
                                >
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Down Arrow */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-0.5 h-6 w-6 p-0"
                                onClick={() =>
                                  updateConfig({
                                    contactPositionY: Math.min(
                                      (config.contactPositionY || 0) + 5,
                                      30,
                                    ),
                                  })
                                }
                                disabled={(config.contactPositionY || 0) >= 30}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={goToPreviousStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                  <Button onClick={goToNextStep}>
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Image Positioning Controls */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <span className="mr-1">3.</span>
                  Imágenes
                </CardTitle>
                <CardDescription>
                  Posiciona las imágenes dentro de sus contenedores para mejor
                  encuadre
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 2-Image Layout Toggle - Only show when we have exactly 2 images */}
                {templateImages.length === 2 && (
                  <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Diseño de 2 Imágenes
                    </Label>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ twoImageLayout: "vertical" })
                        }
                        className={`flex-1 rounded-lg border-2 p-4 transition-all ${
                          config.twoImageLayout === "vertical"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-8 w-12 justify-center gap-1 rounded-md bg-gray-200 p-1">
                            <div className="h-full w-2 rounded-sm bg-gray-400"></div>
                            <div className="h-full w-2 rounded-sm bg-gray-400"></div>
                          </div>
                          <span className="text-sm font-medium">Vertical</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateConfig({ twoImageLayout: "horizontal" })
                        }
                        className={`flex-1 rounded-lg border-2 p-4 transition-all ${
                          config.twoImageLayout === "horizontal"
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex h-8 w-12 flex-col gap-1 rounded-md bg-gray-200 p-1">
                            <div className="h-2 w-full rounded-sm bg-gray-400"></div>
                            <div className="h-2 w-full rounded-sm bg-gray-400"></div>
                          </div>
                          <span className="text-sm font-medium">
                            Horizontal
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {templateImages.map((imageUrl, index) => {
                  const position = propertyData.imagePositions?.[imageUrl] ?? {
                    x: 50,
                    y: 50,
                    zoom: 1.0,
                  };
                  return (
                    <div key={`image-${index}`} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Imagen {index + 1}
                        </span>
                        {index === 0 && (
                          <span className="text-xs text-muted-foreground">
                            (Principal)
                          </span>
                        )}
                      </div>

                      {/* Image preview with positioning and zoom */}
                      <div className="relative h-20 w-full overflow-hidden rounded-md border bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={`Preview ${index + 1}`}
                          className="absolute h-full w-full object-cover"
                          style={{
                            objectPosition: `${position.x}% ${position.y}%`,
                            transform: `scale(${position.zoom ?? 1.0})`,
                            transformOrigin: "center",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <div className="text-center">
                            <div className="text-xs font-medium text-white">
                              {position.x.toFixed(0)}%, {position.y.toFixed(0)}%
                            </div>
                            <div className="text-xs text-white/80">
                              {(position.zoom ?? 1.0).toFixed(1)}x
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Position Controls - Joystick Style */}
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Posición</Label>
                        <div className="text-xs text-muted-foreground">
                          {position.x.toFixed(0)}%, {position.y.toFixed(0)}%
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="flex flex-col items-center">
                          {/* Up Arrow */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mb-0.5 h-6 w-6 p-0"
                            onClick={() =>
                              updateImagePosition(
                                imageUrl,
                                position.x,
                                Math.max(position.y - 5, -500),
                              )
                            }
                            disabled={position.y <= -500}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>

                          <div className="flex items-center gap-0.5">
                            {/* Left Arrow */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                updateImagePosition(
                                  imageUrl,
                                  Math.min(position.x + 5, 500),
                                  position.y,
                                )
                              }
                              disabled={position.x >= 500}
                            >
                              <ChevronLeft className="h-3 w-3" />
                            </Button>

                            {/* Center/Reset Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 rounded-full p-0"
                              onClick={() =>
                                updateImagePosition(imageUrl, 50, 50)
                              }
                            >
                              <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                            </Button>

                            {/* Right Arrow */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() =>
                                updateImagePosition(
                                  imageUrl,
                                  Math.max(position.x - 5, -500),
                                  position.y,
                                )
                              }
                              disabled={position.x <= -500}
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Down Arrow */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-0.5 h-6 w-6 p-0"
                            onClick={() =>
                              updateImagePosition(
                                imageUrl,
                                position.x,
                                Math.min(position.y + 5, 500),
                              )
                            }
                            disabled={position.y >= 500}
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Zoom Controls - Minimalistic */}
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-600">Zoom</Label>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              updateImageZoom(
                                imageUrl,
                                (position.zoom ?? 1.0) - 0.1,
                              )
                            }
                            disabled={(position.zoom ?? 1.0) <= 0.5}
                          >
                            <ZoomOut className="h-3 w-3 text-gray-600" />
                          </button>

                          <div className="flex-1">
                            <Slider
                              value={[position.zoom ?? 1.0]}
                              onValueChange={([value]) =>
                                updateImageZoom(imageUrl, value ?? 1.0)
                              }
                              max={3.0}
                              min={0.5}
                              step={0.1}
                              className="w-full"
                            />
                          </div>

                          <button
                            type="button"
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
                            onClick={() =>
                              updateImageZoom(
                                imageUrl,
                                (position.zoom ?? 1.0) + 0.1,
                              )
                            }
                            disabled={(position.zoom ?? 1.0) >= 3.0}
                          >
                            <ZoomIn className="h-3 w-3 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Navigation */}
                <div className="mt-6 flex justify-start">
                  <Button variant="outline" onClick={goToPreviousStep}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <CartelPreviewPanel
          showPreview={showPreview}
          previewZoom={previewZoom}
          panX={panX}
          panY={panY}
          isDragging={isDragging}
          previewRef={previewRef}
          TemplateComponent={TemplateComponent}
          propertyData={propertyData}
          config={config}
          templateImages={templateImages}
          isGenerating={isGenerating}
          isSavingCartel={isSavingCartel}
          _lastGeneratedPdf={lastGeneratedPdf}
          selectedImageIndices={selectedImageIndices}
          listingId={listingId}
          savedConfigurations={savedConfigurations}
          selectedConfigurationId={currentConfigurationId}
          isLoadingConfigurations={isLoadingConfigurations}
          onLoadConfiguration={loadConfiguration}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          _onZoomChange={setPreviewZoom}
          onMouseDown={handleMouseDown}
          onGeneratePDF={generatePDF}
          onSaveCartel={saveCartelAsDocument}
          onPreviewTemplate={previewTemplate}
          onShowSaveModal={() => setShowSaveModal(true)}
        />
      </div>

      {/* Save Configuration Modal */}
      <SaveConfigurationModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        templateConfig={config}
        selectedContacts={{ phone: selectedPhone, email: selectedEmail }}
        selectedImageIndices={selectedImageIndices}
        onSave={saveConfiguration}
      />
    </div>
  );
}
