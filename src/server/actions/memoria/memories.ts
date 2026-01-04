"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { requireCoupleSession, getCurrentCoupleId, NoCoupleError } from "~/lib/dal-couples";
import {
  getMemoriesForDay,
  getMemoryWithUser,
  createPhotoMemory,
  createVideoMemory,
  createNoteMemory,
  createSongMemory,
  createLocationMemory,
  createQuoteMemory,
  updateMemory,
  deleteMemory,
  reorderMemories,
  canUserModifyMemory,
  verifyMemoryBelongsToCouple,
} from "~/server/queries/memoria/memories";
import { getAllLocationMemories } from "~/server/queries/memoria/locations";
import { getOrCreateDay, getDayById } from "~/server/queries/memoria/days";
import {
  generateMemoriaPresignedUploadUrl,
  getMemoriaS3PublicUrl,
} from "~/lib/s3";
import type {
  ActionResult,
  Memory,
  MemoryWithUser,
  SongData,
  LocationData,
  LocationMemoryForMap,
} from "~/types/memoria";

/**
 * Get all memories for a day
 */
export async function getMemoriesForDayAction(
  date: string
): Promise<ActionResult<MemoryWithUser[]>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Get or create the day
    const day = await getOrCreateDay(coupleId, date);
    const memories = await getMemoriesForDay(day.id, session.user.id);

    return { success: true, data: memories };
  } catch (error) {
    console.error("Error getting memories:", error);
    return { success: false, error: "Error al cargar recuerdos" };
  }
}

/**
 * Get a single memory with full details
 */
export async function getMemoryAction(
  memoryId: string
): Promise<ActionResult<MemoryWithUser>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Verify memory belongs to couple
    const belongs = await verifyMemoryBelongsToCouple(
      BigInt(memoryId),
      coupleId
    );
    if (!belongs) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    const memory = await getMemoryWithUser(BigInt(memoryId), session.user.id);
    if (!memory) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    // Check privacy
    if (memory.isPrivate && memory.userId !== session.user.id) {
      return { success: false, error: "Recuerdo privado" };
    }

    return { success: true, data: memory };
  } catch (error) {
    console.error("Error getting memory:", error);
    return { success: false, error: "Error al cargar el recuerdo" };
  }
}

/**
 * Create a photo memory
 */
export async function createPhotoMemoryAction(data: {
  date: string;
  url: string;
  thumbnailUrl?: string;
  s3Key?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  caption?: string;
  isPrivate?: boolean;
  takenAt?: string;
  deviceInfo?: string;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    // Get or create the day
    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createPhotoMemory({
      dayId: day.id,
      userId: session.user.id,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      caption: data.caption,
      isPrivate: data.isPrivate,
      takenAt: data.takenAt ? new Date(data.takenAt) : undefined,
      deviceInfo: data.deviceInfo,
    });

    revalidatePath(`/dia/${data.date}`);
    revalidatePath("/calendario");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating photo memory:", error);
    return { success: false, error: "Error al crear recuerdo" };
  }
}

/**
 * Create a video memory
 */
export async function createVideoMemoryAction(data: {
  date: string;
  url: string;
  thumbnailUrl?: string;
  s3Key?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  isPrivate?: boolean;
  takenAt?: string;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createVideoMemory({
      dayId: day.id,
      userId: session.user.id,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      width: data.width,
      height: data.height,
      duration: data.duration,
      caption: data.caption,
      isPrivate: data.isPrivate,
      takenAt: data.takenAt ? new Date(data.takenAt) : undefined,
    });

    revalidatePath(`/dia/${data.date}`);
    revalidatePath("/calendario");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating video memory:", error);
    return { success: false, error: "Error al crear recuerdo" };
  }
}

/**
 * Create a note memory
 */
export async function createNoteMemoryAction(data: {
  date: string;
  content: string;
  caption?: string;
  isPrivate?: boolean;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createNoteMemory({
      dayId: day.id,
      userId: session.user.id,
      content: data.content,
      caption: data.caption,
      isPrivate: data.isPrivate,
    });

    revalidatePath(`/dia/${data.date}`);
    revalidatePath("/calendario");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating note memory:", error);
    return { success: false, error: "Error al crear recuerdo" };
  }
}

/**
 * Create a song memory
 */
export async function createSongMemoryAction(data: {
  date: string;
  songData: SongData;
  caption?: string;
  isPrivate?: boolean;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createSongMemory({
      dayId: day.id,
      userId: session.user.id,
      songData: data.songData,
      caption: data.caption,
      isPrivate: data.isPrivate,
    });

    revalidatePath(`/dia/${data.date}`);
    revalidatePath("/calendario");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating song memory:", error);
    return { success: false, error: "Error al crear recuerdo" };
  }
}

/**
 * Create a location memory
 */
export async function createLocationMemoryAction(data: {
  date: string;
  locationData: LocationData;
  caption?: string;
  isPrivate?: boolean;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createLocationMemory({
      dayId: day.id,
      userId: session.user.id,
      locationData: data.locationData,
      caption: data.caption,
      isPrivate: data.isPrivate,
    });

    revalidatePath(`/dia/${data.date}`);
    revalidatePath("/calendario");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating location memory:", error);
    return { success: false, error: "Error al crear recuerdo" };
  }
}

/**
 * Create a quote memory
 */
export async function createQuoteMemoryAction(data: {
  date: string;
  content: string; // The quote text
  caption?: string; // Attribution (who said it)
  isPrivate?: boolean;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createQuoteMemory({
      dayId: day.id,
      userId: session.user.id,
      content: data.content,
      caption: data.caption,
      isPrivate: data.isPrivate,
    });

    revalidatePath(`/dia/${data.date}`);
    revalidatePath("/calendario");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating quote memory:", error);
    return { success: false, error: "Error al crear recuerdo" };
  }
}

/**
 * Update a memory
 */
export async function updateMemoryAction(
  memoryId: string,
  data: {
    caption?: string | null;
    isPrivate?: boolean;
    content?: string;
    songData?: SongData;
    locationData?: LocationData;
  }
): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    // Verify user can modify
    const canModify = await canUserModifyMemory(
      BigInt(memoryId),
      session.user.id
    );
    if (!canModify) {
      return { success: false, error: "No tienes permiso para editar este recuerdo" };
    }

    const memory = await updateMemory(BigInt(memoryId), data);
    if (!memory) {
      return { success: false, error: "Recuerdo no encontrado" };
    }

    // Get day date for revalidation
    const day = await getDayById(memory.dayId);
    if (day) {
      revalidatePath(`/dia/${day.date}`);
    }
    revalidatePath(`/recuerdo/${memoryId}`);

    return { success: true, data: memory };
  } catch (error) {
    console.error("Error updating memory:", error);
    return { success: false, error: "Error al actualizar el recuerdo" };
  }
}

/**
 * Delete a memory
 */
export async function deleteMemoryAction(
  memoryId: string
): Promise<ActionResult<void>> {
  try {
    const session = await requireCoupleSession();

    // Verify user can modify
    const canModify = await canUserModifyMemory(
      BigInt(memoryId),
      session.user.id
    );
    if (!canModify) {
      return { success: false, error: "No tienes permiso para eliminar este recuerdo" };
    }

    await deleteMemory(BigInt(memoryId));

    revalidatePath("/calendario");
    return { success: true };
  } catch (error) {
    console.error("Error deleting memory:", error);
    return { success: false, error: "Error al eliminar el recuerdo" };
  }
}

/**
 * Reorder memories in a day
 */
export async function reorderMemoriesAction(
  date: string,
  positions: { memoryId: string; position: number }[]
): Promise<ActionResult<void>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, date);

    await reorderMemories(
      day.id,
      positions.map((p) => ({
        memoryId: BigInt(p.memoryId),
        position: p.position,
      }))
    );

    revalidatePath(`/dia/${date}`);
    return { success: true };
  } catch (error) {
    console.error("Error reordering memories:", error);
    return { success: false, error: "Error al reordenar recuerdos" };
  }
}

// ============================================================================
// PRESIGNED URL UPLOADS FOR MEMORIA MEDIA
// ============================================================================

export interface MemoriaPresignedUploadResult {
  uploadUrl: string;
  s3Key: string;
  fileUrl: string;
}

/**
 * Generate S3 key for memoria media
 */
function generateMemoriaMediaKey(
  coupleId: bigint,
  date: string,
  type: "photo" | "video",
  filename: string
): string {
  const fileExtension = filename.split(".").pop() ?? (type === "photo" ? "jpg" : "mp4");
  const uniqueId = nanoid(8);
  return `memoria/${coupleId.toString()}/${date}/${type}s/${uniqueId}.${fileExtension}`;
}

/**
 * Get presigned URL for uploading a photo memory to S3
 */
export async function getMemoriaPhotoPresignedUrl(
  date: string,
  filename: string,
  contentType: string
): Promise<ActionResult<MemoriaPresignedUploadResult>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Generate S3 key
    const s3Key = generateMemoriaMediaKey(coupleId, date, "photo", filename);

    // Get presigned URL
    const { uploadUrl } = await generateMemoriaPresignedUploadUrl(s3Key, contentType);

    // Get the public URL
    const fileUrl = getMemoriaS3PublicUrl(s3Key);

    return {
      success: true,
      data: {
        uploadUrl,
        s3Key,
        fileUrl,
      },
    };
  } catch (error) {
    console.error("Error generating photo presigned URL:", error);
    // Provide more specific error messages
    if (error instanceof NoCoupleError) {
      return { success: false, error: "Debes estar en pareja para subir fotos" };
    }
    if (error instanceof Error) {
      if (error.message.includes("AWS") || error.message.includes("S3") || error.message.includes("bucket")) {
        return { success: false, error: "Error de configuración de almacenamiento" };
      }
    }
    return { success: false, error: "Error al preparar la subida de foto" };
  }
}

/**
 * Get presigned URL for uploading a video memory to S3
 */
export async function getMemoriaVideoPresignedUrl(
  date: string,
  filename: string,
  contentType: string
): Promise<ActionResult<MemoriaPresignedUploadResult>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Generate S3 key
    const s3Key = generateMemoriaMediaKey(coupleId, date, "video", filename);

    // Get presigned URL
    const { uploadUrl } = await generateMemoriaPresignedUploadUrl(s3Key, contentType);

    // Get the public URL
    const fileUrl = getMemoriaS3PublicUrl(s3Key);

    return {
      success: true,
      data: {
        uploadUrl,
        s3Key,
        fileUrl,
      },
    };
  } catch (error) {
    console.error("Error generating video presigned URL:", error);
    // Provide more specific error messages
    if (error instanceof NoCoupleError) {
      return { success: false, error: "Debes estar en pareja para subir vídeos" };
    }
    if (error instanceof Error) {
      if (error.message.includes("AWS") || error.message.includes("S3") || error.message.includes("bucket")) {
        return { success: false, error: "Error de configuración de almacenamiento" };
      }
    }
    return { success: false, error: "Error al preparar la subida de vídeo" };
  }
}

/**
 * Get presigned URL for uploading a video thumbnail to S3
 */
export async function getMemoriaThumbnailPresignedUrl(
  date: string,
  videoFilename: string
): Promise<ActionResult<MemoriaPresignedUploadResult>> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    // Generate S3 key for thumbnail (same folder as video but with _thumb suffix)
    const uniqueId = nanoid(8);
    const s3Key = `memoria/${coupleId.toString()}/${date}/thumbnails/${uniqueId}_thumb.jpg`;

    // Get presigned URL for JPEG thumbnail
    const { uploadUrl } = await generateMemoriaPresignedUploadUrl(s3Key, "image/jpeg");

    // Get the public URL
    const fileUrl = getMemoriaS3PublicUrl(s3Key);

    return {
      success: true,
      data: {
        uploadUrl,
        s3Key,
        fileUrl,
      },
    };
  } catch (error) {
    console.error("Error generating thumbnail presigned URL:", error);
    return { success: false, error: "Error al preparar la subida de miniatura" };
  }
}

/**
 * Create a photo memory after successful S3 upload
 */
export async function createPhotoMemoryAfterUpload(data: {
  date: string;
  url: string;
  s3Key: string;
  mimeType: string;
  fileSize?: number;
  caption?: string;
  isPrivate?: boolean;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    // Get or create the day
    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createPhotoMemory({
      dayId: day.id,
      userId: session.user.id,
      url: data.url,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      caption: data.caption,
      isPrivate: data.isPrivate,
    });

    revalidatePath(`/memoria/dia/${data.date}`);
    revalidatePath("/memoria");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating photo memory:", error);
    return { success: false, error: "Error al crear el recuerdo" };
  }
}

/**
 * Create a video memory after successful S3 upload
 */
export async function createVideoMemoryAfterUpload(data: {
  date: string;
  url: string;
  s3Key: string;
  mimeType: string;
  fileSize?: number;
  duration?: number;
  thumbnailUrl?: string;
  caption?: string;
  isPrivate?: boolean;
}): Promise<ActionResult<Memory>> {
  try {
    const session = await requireCoupleSession();

    const day = await getOrCreateDay(session.user.coupleId, data.date);

    const memory = await createVideoMemory({
      dayId: day.id,
      userId: session.user.id,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      s3Key: data.s3Key,
      mimeType: data.mimeType,
      fileSize: data.fileSize,
      duration: data.duration,
      caption: data.caption,
      isPrivate: data.isPrivate,
    });

    revalidatePath(`/memoria/dia/${data.date}`);
    revalidatePath("/memoria");
    return { success: true, data: memory };
  } catch (error) {
    console.error("Error creating video memory:", error);
    return { success: false, error: "Error al crear el recuerdo" };
  }
}

// ============================================================================
// LOCATION MEMORIES FOR MAP VIEW
// ============================================================================

/**
 * Get all location memories for the current couple (for map view)
 */
export async function getLocationMemoriesAction(): Promise<
  ActionResult<LocationMemoryForMap[]>
> {
  try {
    const session = await requireCoupleSession();
    const coupleId = session.user.coupleId;

    const locations = await getAllLocationMemories(coupleId, session.user.id);

    return { success: true, data: locations };
  } catch (error) {
    console.error("Error getting location memories:", error);
    if (error instanceof NoCoupleError) {
      return { success: false, error: "Debes estar en pareja para ver el mapa" };
    }
    return { success: false, error: "Error al cargar ubicaciones" };
  }
}
