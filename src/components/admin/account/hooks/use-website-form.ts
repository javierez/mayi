"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getWebsiteConfigurationAction,
  getCurrentUserAccountId,
} from "~/app/actions/website-settings";
import {
  websiteConfigurationSchema,
  type WebsiteConfigurationInput,
} from "~/types/website-settings";

// Hook return type for state management
interface UseWebsiteFormReturn {
  form: ReturnType<typeof useForm<WebsiteConfigurationInput>>;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  accountId: bigint | null;
}

// Custom hook for website form state management
export function useWebsiteForm(userId?: string): UseWebsiteFormReturn {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [accountId, setAccountId] = useState<bigint | null>(null);

  // Initialize form with zodResolver and defaultValues - PRESERVE existing structure exactly
  const form = useForm<WebsiteConfigurationInput>({
    resolver: zodResolver(websiteConfigurationSchema),
    defaultValues: {
      socialLinks: {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        youtube: "",
      },
      seoProps: {
        title: "",
        description: "",
        keywords: "",
        name: "",
        email: "",
        telephone: "",
        url: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        ogType: "website",
        ogUrl: "",
        ogLocale: "es_ES",
        ogSiteName: "",
      },
      logo: "",
      favicon: "",
      heroProps: {
        title: "",
        subtitle: "",
        backgroundImage: "",
        findPropertyButton: "Explorar Propiedades",
        contactButton: "Contáctanos",
      },
      featuredProps: {
        title: "Propiedades Destacadas",
        subtitle: "",
      },
      aboutProps: {
        title: "Sobre Nosotros",
        subtitle: "",
        content: "",
        content2: "",
        image: "",
        services: [],
        maxServicesDisplayed: 6,
        servicesSectionTitle: "Nuestros Servicios",
        aboutSectionTitle: "Nuestra Misión",
        buttonName: "Contacta a Nuestro Equipo",
        showKPI: true,
        kpi1Name: "",
        kpi1Data: "",
        kpi2Name: "",
        kpi2Data: "",
        kpi3Name: "",
        kpi3Data: "",
        kpi4Name: "",
        kpi4Data: "",
      },
      propertiesProps: {
        title: "Nuestras Propiedades",
        subtitle: "",
        itemsPerPage: 12,
      },
      testimonialProps: {
        title: "Lo que dicen nuestros clientes",
        testimonials: [],
      },
      contactProps: {
        title: "Contáctanos",
        subtitle: "",
        messageForm: true,
        address: true,
        phone: true,
        mail: true,
        schedule: true,
        map: true,
        offices: [],
      },
      footerProps: {
        companyName: "",
        description: "",
        socialLinks: {
          facebook: "",
          instagram: "",
          twitter: "",
          linkedin: "",
        },
        officeLocations: [],
        quickLinksVisibility: {
          inicio: true,
          propiedades: true,
          nosotros: true,
          reseñas: true,
          contacto: true,
          comprar: false,
          alquilar: false,
          vender: false,
        },
        propertyTypesVisibility: {
          pisos: true,
          casas: true,
          locales: true,
          solares: true,
          garajes: true,
        },
        copyright: "",
        links: [],
      },
      headProps: {
        customScripts: "",
        googleAnalytics: "",
        facebookPixel: "",
      },
      metadata: {
        id: "",
        account_id: "",
        created_at: "",
        updated_at: "",
        logotype: "",
        mainpage: "",
      },
    },
  });

  // Load configuration data on mount - PRESERVE existing loading logic
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        const userAccountId = await getCurrentUserAccountId(userId);

        if (!userAccountId) {
          setError("No se pudo obtener el ID de la cuenta");
          return;
        }

        setAccountId(userAccountId);
        const result = await getWebsiteConfigurationAction(userAccountId);

        if (result.success && result.data) {
          console.log(
            "📋 FORM: Loading website configuration data:",
            result.data,
          );
          console.log("📋 FORM: metadata field:", result.data.metadata);
          console.log(
            "📋 FORM: metadata.mainpage:",
            result.data.metadata?.mainpage,
          );

          // Ensure all fields have defined values (not undefined)
          const formData = {
            ...result.data,
            seoProps: {
              title: result.data.seoProps?.title ?? "",
              description: result.data.seoProps?.description ?? "",
              keywords: result.data.seoProps?.keywords ?? "",
              name: result.data.seoProps?.name ?? "",
              email: result.data.seoProps?.email ?? "",
              telephone: result.data.seoProps?.telephone ?? "",
              url: result.data.seoProps?.url ?? "",
              ogTitle: result.data.seoProps?.ogTitle ?? "",
              ogDescription: result.data.seoProps?.ogDescription ?? "",
              ogImage: result.data.seoProps?.ogImage ?? "",
              ogType: result.data.seoProps?.ogType ?? "website",
              ogUrl: result.data.seoProps?.ogUrl ?? "",
              ogLocale: result.data.seoProps?.ogLocale ?? "es_ES",
              ogSiteName: result.data.seoProps?.ogSiteName ?? "",
            },
            heroProps: {
              title: result.data.heroProps?.title ?? "",
              subtitle: result.data.heroProps?.subtitle ?? "",
              backgroundImage: result.data.heroProps?.backgroundImage ?? "",
              findPropertyButton:
                result.data.heroProps?.findPropertyButton ??
                "Explorar Propiedades",
              contactButton:
                result.data.heroProps?.contactButton ?? "Contáctanos",
            },
            aboutProps: {
              ...result.data.aboutProps,
              services: result.data.aboutProps?.services ?? [],
              title: result.data.aboutProps?.title ?? "Sobre Nosotros",
              subtitle: result.data.aboutProps?.subtitle ?? "",
              content: result.data.aboutProps?.content ?? "",
              content2: result.data.aboutProps?.content2 ?? "",
              image: result.data.aboutProps?.image ?? "",
              maxServicesDisplayed:
                result.data.aboutProps?.maxServicesDisplayed ?? 6,
              servicesSectionTitle:
                result.data.aboutProps?.servicesSectionTitle ??
                "Nuestros Servicios",
              aboutSectionTitle:
                result.data.aboutProps?.aboutSectionTitle ?? "Nuestra Misión",
              buttonName:
                result.data.aboutProps?.buttonName ??
                "Contacta a Nuestro Equipo",
              showKPI: result.data.aboutProps?.showKPI ?? true,
              kpi1Name: result.data.aboutProps?.kpi1Name ?? "",
              kpi1Data: result.data.aboutProps?.kpi1Data ?? "",
              kpi2Name: result.data.aboutProps?.kpi2Name ?? "",
              kpi2Data: result.data.aboutProps?.kpi2Data ?? "",
              kpi3Name: result.data.aboutProps?.kpi3Name ?? "",
              kpi3Data: result.data.aboutProps?.kpi3Data ?? "",
              kpi4Name: result.data.aboutProps?.kpi4Name ?? "",
              kpi4Data: result.data.aboutProps?.kpi4Data ?? "",
            },
          };

          form.reset(formData);
          console.log("📋 FORM: Form reset completed with data");
        } else {
          console.log("❌ FORM: Failed to load website configuration:", result);
        }
      } catch (error) {
        console.error("Error loading website configuration:", error);
        setError("Error al cargar la configuración");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [userId, form]);

  // Watch for form changes to set unsaved changes flag - PRESERVE existing logic
  useEffect(() => {
    const subscription = form.watch((data) => {
      console.log("📝 Form data changed:", data);
      setHasUnsavedChanges(true);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return {
    form,
    loading: isLoading,
    error,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    accountId,
  };
}
