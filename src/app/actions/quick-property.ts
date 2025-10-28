"use server";

import { createMinimalPropertyWithListing } from "~/server/queries/properties";

type CreateQuickPropertyResult =
  | {
      success: true;
      data: {
        propertyId: number;
        listingId: number;
        referenceNumber: string;
      };
    }
  | {
      success: false;
      error: string;
    };

export async function createQuickPropertyAction(): Promise<CreateQuickPropertyResult> {
  try {
    const result = await createMinimalPropertyWithListing();

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error in createQuickPropertyAction:", error);

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create property",
    };
  }
}
