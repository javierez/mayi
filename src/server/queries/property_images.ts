import { db } from "../db";
import { propertyImages } from "../db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import type { PropertyImage } from "../../lib/data";

// Create a new property image
export async function createPropertyImage(
  data: Omit<PropertyImage, "propertyImageId" | "createdAt" | "updatedAt">,
) {
  try {
    console.log("🔍 createPropertyImage called with:", {
      propertyId: data.propertyId?.toString() ?? "undefined",
      referenceNumber: data.referenceNumber,
      imageOrder: data.imageOrder,
      imageTag: data.imageTag,
      originImageId: data.originImageId?.toString() ?? "undefined",
      hasOriginImageId: "originImageId" in data,
      dataKeys: Object.keys(data),
    });

    const [propertyImage] = await db
      .insert(propertyImages)
      .values(data)
      .$returningId();

    console.log("✅ createPropertyImage success:", {
      propertyImageId: propertyImage?.propertyImageId?.toString() ?? "null",
      success: !!propertyImage,
    });

    return propertyImage;
  } catch (error) {
    console.error("❌ Error creating property image:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      data: {
        propertyId: data.propertyId?.toString() ?? "undefined",
        referenceNumber: data.referenceNumber,
        imageOrder: data.imageOrder,
        originImageId: data.originImageId?.toString() ?? "undefined",
      },
    });
    throw error;
  }
}

// Get a property image by ID
export async function getPropertyImageById(propertyImageId: bigint) {
  try {
    const [propertyImage] = await db
      .select()
      .from(propertyImages)
      .where(eq(propertyImages.propertyImageId, propertyImageId));
    return propertyImage;
  } catch (error) {
    console.error("Error getting property image:", error);
    throw error;
  }
}

// Get property images by reference number (excludes videos, YouTube links, and virtual tours)
export async function getPropertyImagesByReference(
  referenceNumber: string,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.referenceNumber, referenceNumber),
      // Only get actual images, not videos, YouTube links, or virtual tours
      and(
        sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
      ),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property images by reference:", error);
    throw error;
  }
}

// Get all images for a property (excludes videos, YouTube links, and virtual tours)
export async function getPropertyImages(propertyId: bigint, isActive = true) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      // Only get actual images, not videos, YouTube links, or virtual tours
      and(
        sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
      ),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property images:", error);
    throw error;
  }
}

// Get count of images for a property (optimized query, excludes videos, YouTube links, and virtual tours)
export async function getPropertyImagesCount(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      // Only count actual images, not videos, YouTube links, or virtual tours
      and(
        sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
      ),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyImages)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error getting property images count:", error);
    return 0;
  }
}

// Update a property image
export async function updatePropertyImage(
  propertyImageId: bigint,
  data: Partial<PropertyImage>,
) {
  try {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    await db
      .update(propertyImages)
      .set(updateData)
      .where(eq(propertyImages.propertyImageId, propertyImageId));

    return await getPropertyImageById(propertyImageId);
  } catch (error) {
    console.error("Error updating property image:", error);
    throw error;
  }
}

// Delete a property image (soft delete by setting isActive to false)
export async function deletePropertyImage(propertyImageId: bigint) {
  try {
    const propertyImage = await getPropertyImageById(propertyImageId);
    await db
      .update(propertyImages)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(propertyImages.propertyImageId, propertyImageId));
    return propertyImage;
  } catch (error) {
    console.error("Error deleting property image:", error);
    throw error;
  }
}

// Hard delete a property image (use with caution)
export async function hardDeletePropertyImage(propertyImageId: bigint) {
  try {
    const propertyImage = await getPropertyImageById(propertyImageId);
    await db
      .delete(propertyImages)
      .where(eq(propertyImages.propertyImageId, propertyImageId));
    return propertyImage;
  } catch (error) {
    console.error("Error hard deleting property image:", error);
    throw error;
  }
}

// Get all videos for a property (filtered by imageTag = 'video')
export async function getPropertyVideos(propertyId: bigint, isActive = true) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageTag, "video"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property videos:", error);
    throw error;
  }
}

// Get videos by reference number (filtered by imageTag = 'video')
export async function getPropertyVideosByReference(
  referenceNumber: string,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.referenceNumber, referenceNumber),
      eq(propertyImages.imageTag, "video"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property videos by reference:", error);
    throw error;
  }
}

// Get count of videos for a property (optimized query)
export async function getPropertyVideosCount(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageTag, "video"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyImages)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error getting property videos count:", error);
    return 0;
  }
}

// Get all YouTube links for a property (filtered by imageTag = 'youtube')
export async function getPropertyYouTubeLinks(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageTag, "youtube"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property YouTube links:", error);
    throw error;
  }
}

// Get YouTube links by reference number (filtered by imageTag = 'youtube')
export async function getPropertyYouTubeLinksByReference(
  referenceNumber: string,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.referenceNumber, referenceNumber),
      eq(propertyImages.imageTag, "youtube"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property YouTube links by reference:", error);
    throw error;
  }
}

// Get count of YouTube links for a property (optimized query)
export async function getPropertyYouTubeLinksCount(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageTag, "youtube"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyImages)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error getting property YouTube links count:", error);
    return 0;
  }
}

// Get all virtual tours for a property (filtered by imageTag = 'tour')
export async function getPropertyVirtualTours(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageTag, "tour"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property virtual tours:", error);
    throw error;
  }
}

// Get virtual tours by reference number (filtered by imageTag = 'tour')
export async function getPropertyVirtualToursByReference(
  referenceNumber: string,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.referenceNumber, referenceNumber),
      eq(propertyImages.imageTag, "tour"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    return await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .orderBy(asc(propertyImages.imageOrder));
  } catch (error) {
    console.error("Error getting property virtual tours by reference:", error);
    throw error;
  }
}

// Get count of virtual tours for a property (optimized query)
export async function getPropertyVirtualToursCount(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageTag, "tour"),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(propertyImages)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error("Error getting property virtual tours count:", error);
    return 0;
  }
}

// Get the maximum image_order for a property (excludes videos, YouTube links, and virtual tours)
export async function getMaxImageOrder(propertyId: bigint, isActive = true) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      // Only consider actual images, not videos, YouTube links, or virtual tours
      and(
        sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
      ),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    const result = await db
      .select({
        maxOrder: sql<number>`COALESCE(MAX(${propertyImages.imageOrder}), 0)`,
      })
      .from(propertyImages)
      .where(and(...conditions));

    return result[0]?.maxOrder ?? 0;
  } catch (error) {
    console.error("Error getting max image order:", error);
    return 0;
  }
}

// Get the first property image (image_order = 1, excludes videos, YouTube links, and virtual tours)
export async function getFirstPropertyImage(
  propertyId: bigint,
  isActive = true,
) {
  try {
    const conditions = [
      eq(propertyImages.propertyId, propertyId),
      eq(propertyImages.imageOrder, 1),
      // Only get actual images, not videos, YouTube links, or virtual tours
      and(
        sql`(${propertyImages.imageTag} IS NULL OR ${propertyImages.imageTag} NOT IN ('video', 'youtube', 'tour'))`,
      ),
    ];
    if (isActive !== undefined) {
      conditions.push(eq(propertyImages.isActive, isActive));
    }

    const [firstImage] = await db
      .select()
      .from(propertyImages)
      .where(and(...conditions))
      .limit(1);

    return firstImage;
  } catch (error) {
    console.error("Error getting first property image:", error);
    return null;
  }
}
