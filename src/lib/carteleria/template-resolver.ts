import { type FC } from "react";
import type { ConfigurableTemplateProps } from "~/types/template-data";
import { ClassicTemplate } from "~/components/admin/carteleria/templates/classic/classic-vertical-template";
import { BasicTemplate } from "~/components/propiedades/detail/cartel/templates/basic-template";
import { BasicHorizontalTemplate } from "~/components/propiedades/detail/cartel/templates/basic-horizontal-template";

export type TemplateStyle = "classic" | "basic";
export type TemplateOrientation = "vertical" | "horizontal";
export type FullTemplateStyle =
  | "classic-vertical"
  | "classic-horizontal"
  | "basic-vertical"
  | "basic-horizontal";

export interface AccountPreferences {
  poster_preferences?: {
    template_style?: TemplateStyle;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Resolves and returns the appropriate template component based on account preferences and orientation
 * @param preferences - Account preferences JSON containing poster_preferences
 * @param orientation - Template orientation ("vertical" or "horizontal")
 * @returns The template component to render
 */
export function getTemplateComponent(
  preferences: string | AccountPreferences | null | undefined,
  orientation: TemplateOrientation = "vertical",
): FC<ConfigurableTemplateProps> {
  try {
    let parsedPreferences: AccountPreferences;

    // Handle different input formats
    if (typeof preferences === "string") {
      parsedPreferences = JSON.parse(preferences) as AccountPreferences;
    } else if (preferences && typeof preferences === "object") {
      parsedPreferences = preferences;
    } else {
      // Default to classic template if no preferences
      return ClassicTemplate;
    }

    // Extract template style from poster_preferences
    const templateStyle =
      parsedPreferences.poster_preferences?.template_style ?? "classic";

    // Create full template identifier
    const fullTemplateStyle: FullTemplateStyle = `${templateStyle}-${orientation}`;

    switch (fullTemplateStyle) {
      case "basic-vertical":
        return BasicTemplate; // Current basic template is vertical
      case "basic-horizontal":
        return BasicHorizontalTemplate; // New horizontal template
      case "classic-vertical":
        return ClassicTemplate; // Current classic template is vertical
      case "classic-horizontal":
        // TODO: Import ClassicHorizontalTemplate when created
        return ClassicTemplate; // Temporary fallback
      default:
        return ClassicTemplate; // Safe fallback
    }
  } catch (error) {
    console.error(
      "Error parsing account preferences for template selection:",
      error,
    );
    // Fallback to classic template on error
    return ClassicTemplate;
  }
}

/**
 * Gets the template style name from preferences for display purposes
 * @param preferences - Account preferences JSON containing poster_preferences
 * @param orientation - Template orientation ("vertical" or "horizontal")
 * @returns The full template style name or "classic-vertical" as default
 */
export function getTemplateStyleName(
  preferences: string | AccountPreferences | null | undefined,
  orientation: TemplateOrientation = "vertical",
): FullTemplateStyle {
  try {
    let parsedPreferences: AccountPreferences;

    if (typeof preferences === "string") {
      parsedPreferences = JSON.parse(preferences) as AccountPreferences;
    } else if (preferences && typeof preferences === "object") {
      parsedPreferences = preferences;
    } else {
      return `classic-${orientation}`;
    }

    const templateStyle =
      parsedPreferences.poster_preferences?.template_style ?? "classic";
    return `${templateStyle}-${orientation}` as FullTemplateStyle;
  } catch (error) {
    console.error(
      "Error parsing account preferences for template style:",
      error,
    );
    return `classic-${orientation}` as FullTemplateStyle;
  }
}
