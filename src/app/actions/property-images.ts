"use server";

import {
  getPropertyImagesCount,
  getFirstPropertyImage,
  getPropertyImages,
} from "~/server/queries/property_images";

export async function getPropertyImageCount(
  propertyId: bigint,
): Promise<number> {
  try {
    return await getPropertyImagesCount(propertyId);
  } catch (error) {
    console.error("Error fetching property image count:", error);
    return 0;
  }
}

export async function getFirstImage(
  propertyId: number | bigint,
): Promise<string | null> {
  try {
    const bigIntPropertyId =
      typeof propertyId === "number" ? BigInt(propertyId) : propertyId;
    const firstImage = await getFirstPropertyImage(bigIntPropertyId);
    return firstImage?.imageUrl ?? null;
  } catch (error) {
    console.error("Error fetching first property image:", error);
    return null;
  }
}

export async function getAllPropertyImages(
  propertyId: number | bigint,
): Promise<string[]> {
  try {
    const bigIntPropertyId =
      typeof propertyId === "number" ? BigInt(propertyId) : propertyId;
    const images = await getPropertyImages(bigIntPropertyId, true);
    return images
      .map((img) => img.imageUrl)
      .filter((url): url is string => url !== null);
  } catch (error) {
    console.error("Error fetching property images:", error);
    return [];
  }
}
