"use server";

import { revalidatePath } from "next/cache";
import { requireCoupleSession, getCurrentCoupleId } from "~/lib/dal-couples";
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
import { getOrCreateDay, getDayById } from "~/server/queries/memoria/days";
import type {
  ActionResult,
  Memory,
  MemoryWithUser,
  SongData,
  LocationData,
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
