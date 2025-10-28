"use client";

import { ClassicTemplate } from "~/components/admin/carteleria/templates/classic/classic-vertical-template";
import { BasicTemplate } from "~/components/propiedades/detail/cartel/templates/basic-template";
import { BasicHorizontalTemplate } from "~/components/propiedades/detail/cartel/templates/basic-horizontal-template";
import { getExtendedDefaultPropertyData } from "~/lib/carteleria/mock-data";
import type {
  TemplateConfiguration,
  ExtendedTemplatePropertyData,
} from "~/types/template-data";
import { useSearchParams } from "next/navigation";

export default function TemplatesPage() {
  const searchParams = useSearchParams();

  // Try to parse config and data from query parameters
  let config: TemplateConfiguration;
  let data: ExtendedTemplatePropertyData;

  const configParam = searchParams.get("config");
  const dataParam = searchParams.get("data");

  try {
    if (configParam && dataParam) {
      config = JSON.parse(configParam) as TemplateConfiguration;
      data = JSON.parse(dataParam) as ExtendedTemplatePropertyData;
    } else {
      // Fallback to default config and data
      data = getExtendedDefaultPropertyData("piso");
      config = {
        templateStyle: "classic",
        orientation: "vertical",
        propertyType: "piso",
        imageCount: 4,
        twoImageLayout: "vertical",
        showIcons: true,
        showQR: true,
        showWatermark: true,
        showPhone: true,
        showEmail: true,
        showWebsite: true,
        showReference: true,
        showShortDescription: false,
        showEnergyRating: false,
        listingType: "venta",
        additionalFields: ["energyConsumptionScale", "yearBuilt"],
        titleFont: "default",
        priceFont: "default",
        overlayColor: "default",
        titleAlignment: "left",
        titleSize: 32,
        titleColor: "#000000",
        titlePositionX: 0,
        titlePositionY: 0,
        locationFont: "default",
        locationAlignment: "left",
        locationSize: 24,
        locationColor: "#666666",
        locationPositionX: 0,
        locationPositionY: 0,
        locationBorderRadius: 8,
        priceAlignment: "left",
        priceSize: 48,
        priceColor: "#000000",
        pricePositionX: 0,
        pricePositionY: 0,
        contactPositionX: 0,
        contactPositionY: 0,
        contactBackgroundColor: "#ffffff",
        contactBorderRadius: 8,
        iconSize: 1.0,
        iconTextGap: 4,
        iconPairGap: 20,
        iconSpacingHorizontal: 20,
        iconSpacingVertical: 10,
        // Description styling defaults
        descriptionFont: "default",
        descriptionAlignment: "left",
        descriptionSize: 16,
        descriptionColor: "#000000",
        descriptionPositionX: 0,
        descriptionPositionY: 0,
        // Bullet styling defaults
        bulletFont: "default",
        bulletAlignment: "left",
        bulletSize: 14,
        bulletColor: "#000000",
        bulletPositionX: 0,
        bulletPositionY: 0,
        referenceTextColor: "#ffffff",
      };
    }
  } catch (error) {
    console.error("Error parsing template parameters:", error);
    // Fallback to default on parse error
    data = getExtendedDefaultPropertyData("piso");
    config = {
      templateStyle: "classic",
      orientation: "vertical",
      propertyType: "piso",
      imageCount: 4,
      twoImageLayout: "vertical",
      showIcons: true,
      showQR: true,
      showWatermark: true,
      showPhone: true,
      showEmail: true,
      showWebsite: true,
      showReference: true,
      showShortDescription: false,
      showEnergyRating: false,
      listingType: "venta",
      additionalFields: ["energyConsumptionScale", "yearBuilt"],
      titleFont: "default",
      priceFont: "default",
      overlayColor: "default",
      titleAlignment: "left",
      titleSize: 32,
      titleColor: "#000000",
      titlePositionX: 0,
      titlePositionY: 0,
      locationFont: "default",
      locationAlignment: "left",
      locationSize: 24,
      locationColor: "#666666",
      locationPositionX: 0,
      locationPositionY: 0,
      locationBorderRadius: 8,
      priceAlignment: "left",
      priceSize: 48,
      priceColor: "#000000",
      pricePositionX: 0,
      pricePositionY: 0,
      contactPositionX: 0,
      contactPositionY: 0,
      contactBackgroundColor: "#ffffff",
      contactBorderRadius: 8,
      iconSize: 1.0,
      iconTextGap: 4,
      iconPairGap: 20,
      iconSpacingHorizontal: 20,
      iconSpacingVertical: 10,
      // Description styling defaults
      descriptionFont: "default",
      descriptionAlignment: "left",
      descriptionSize: 16,
      descriptionColor: "#000000",
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
    };
  }

  // Determine which template component to render based on config style and orientation
  const getTemplateComponent = () => {
    const templateStyle = config.templateStyle || "classic";
    const orientation = config.orientation || "vertical";

    // Create template identifier
    const templateKey = `${templateStyle}-${orientation}`;

    switch (templateKey) {
      case "basic-vertical":
        return <BasicTemplate data={data} config={config} />;
      case "basic-horizontal":
        return <BasicHorizontalTemplate data={data} config={config} />;
      case "classic-vertical":
        return <ClassicTemplate data={data} config={config} />;
      case "classic-horizontal":
        // TODO: Add ClassicHorizontalTemplate when created
        return <ClassicTemplate data={data} config={config} />; // Fallback to vertical for now
      default:
        // Default fallback
        return <ClassicTemplate data={data} config={config} />;
    }
  };

  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: "white" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @page {
            size: A4 ${config.orientation === "horizontal" ? "landscape" : "portrait"};
            margin: 0;
          }
          
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          
          /* Ensure template fills the entire page for PDF generation */
          .template-container, .basic-template-container, .basic-horizontal-template-container {
            width: ${config.orientation === "horizontal" ? "297mm" : "210mm"};
            height: ${config.orientation === "horizontal" ? "210mm" : "297mm"};
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
        `,
        }}
      />
      {getTemplateComponent()}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          // Signal that template is ready for PDF generation
          window.templateReady = true;
          document.body.classList.add('template-ready');
          console.log('✅ Template page rendered and ready for PDF');
          
          // Wait for all images to load
          const images = document.querySelectorAll('img');
          let loadedImages = 0;
          const totalImages = images.length;
          
          function checkAllImagesLoaded() {
            loadedImages++;
            if (loadedImages === totalImages || totalImages === 0) {
              window.templateReady = true;
              console.log('✅ All images loaded, template fully ready');
            }
          }
          
          if (totalImages === 0) {
            window.templateReady = true;
          } else {
            images.forEach(img => {
              if (img.complete) {
                checkAllImagesLoaded();
              } else {
                img.addEventListener('load', checkAllImagesLoaded);
                img.addEventListener('error', checkAllImagesLoaded);
              }
            });
          }
          
          // Fallback - mark as ready after 5 seconds
          setTimeout(() => {
            window.templateReady = true;
            console.log('✅ Template ready (timeout fallback)');
          }, 5000);
        `,
        }}
      />
    </div>
  );
}
