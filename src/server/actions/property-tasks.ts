"use server";

import { createTaskWithAuth } from "~/server/queries/task";
import { db } from "~/server/db";
import { listingContacts } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

interface CreatePropertyTasksParams {
  userId: string;
  listingId: bigint;
}

interface CreatePropertyTasksResult {
  imageUploadTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  completeInfoTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  scheduleVisitTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  pickupKeysTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  valuationTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  createHojaEncargoTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  signedHojaEncargoTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
  generateCartelTask: Awaited<ReturnType<typeof createTaskWithAuth>> | null;
}

/**
 * Creates standard tasks for a new property listing
 * These tasks are created when saving properties from:
 * - Quick form
 * - Voice property form
 * - Textract OCR processing
 */
export async function createPropertyTasks({
  userId,
  listingId,
}: CreatePropertyTasksParams): Promise<CreatePropertyTasksResult> {
  // Query the database to get the owner's listing_contact_id and contact_id for this listing
  let ownerListingContactId: bigint | undefined;
  let ownerContactId: bigint | undefined;
  try {
    const [ownerRelation] = await db
      .select({
        listingContactId: listingContacts.listingContactId,
        contactId: listingContacts.contactId,
      })
      .from(listingContacts)
      .where(
        and(
          eq(listingContacts.listingId, listingId),
          eq(listingContacts.contactType, "owner"),
          eq(listingContacts.isActive, true),
        ),
      )
      .limit(1);

    ownerListingContactId = ownerRelation?.listingContactId;
    ownerContactId = ownerRelation?.contactId;
  } catch (error) {
    console.error(
      "Error fetching owner listing_contact_id and contact_id:",
      error,
    );
    // Continue with undefined if query fails
  }

  const dueDate7Days = new Date();
  dueDate7Days.setDate(dueDate7Days.getDate() + 7);

  const dueDate10Days = new Date();
  dueDate10Days.setDate(dueDate10Days.getDate() + 10);

  const dueDate12Days = new Date();
  dueDate12Days.setDate(dueDate12Days.getDate() + 12);

  const dueDate14Days = new Date();
  dueDate14Days.setDate(dueDate14Days.getDate() + 14);

  const dueDate16Days = new Date();
  dueDate16Days.setDate(dueDate16Days.getDate() + 16);

  // Task for uploading property images
  const imageUploadTask = await createTaskWithAuth({
    userId,
    title: "Subir fotos de la propiedad",
    description:
      "Cargar y organizar las fotografías del inmueble para mejorar la presentación en portales inmobiliarios y atraer más interesados",
    category: "property",
    dueDate: dueDate7Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create image upload task:", error);
    return null;
  });

  // Task for completing property information questionnaire
  const completeInfoTask = await createTaskWithAuth({
    userId,
    title: "Completar información del inmueble en el cuestionario",
    description:
      "Revisar y completar todos los campos pendientes del cuestionario para tener la información completa del inmueble",
    category: "property",
    dueDate: dueDate7Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create complete info task:", error);
    return null;
  });

  // Task for scheduling property visit
  const scheduleVisitTask = await createTaskWithAuth({
    userId,
    title: "Programar visita al inmueble",
    description:
      "Coordinar y agendar una visita con el propietario para conocer el inmueble y tomar fotografías profesionales",
    category: "property",
    dueDate: dueDate10Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create schedule visit task:", error);
    return null;
  });

  // Task for picking up property keys
  const pickupKeysTask = await createTaskWithAuth({
    userId,
    title: "Recoger llaves del inmueble",
    description:
      "Coordinar con el propietario la recogida de las llaves para facilitar las visitas y gestiones del inmueble",
    category: "property",
    dueDate: dueDate10Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create pickup keys task:", error);
    return null;
  });

  // Task for property valuation
  const valuationTask = await createTaskWithAuth({
    userId,
    title: "Realizar valoración del inmueble",
    description:
      "Realizar una valoración profesional del inmueble considerando ubicación, estado, mercado local y características únicas",
    category: "property",
    dueDate: dueDate10Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create valuation task:", error);
    return null;
  });

  // Task for creating hoja de encargo
  const createHojaEncargoTask = await createTaskWithAuth({
    userId,
    title: "Crear hoja de encargo",
    description:
      "Preparar y redactar la hoja de encargo con todos los términos y condiciones para la comercialización del inmueble",
    category: "property",
    dueDate: dueDate12Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create hoja de encargo task:", error);
    return null;
  });

  // Task for signed hoja de encargo
  const signedHojaEncargoTask = await createTaskWithAuth({
    userId,
    title: "Firmar hoja de encargo",
    description:
      "Coordinar la firma de la hoja de encargo con el propietario para formalizar el mandato de comercialización",
    category: "property",
    dueDate: dueDate14Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create signed hoja de encargo task:", error);
    return null;
  });

  // Task for generating cartel
  const generateCartelTask = await createTaskWithAuth({
    userId,
    title: "Generar cartel del inmueble",
    description:
      "Crear el cartel promocional del inmueble con fotografías, características y información comercial para su difusión",
    category: "property",
    dueDate: dueDate16Days,
    dueTime: undefined,
    completed: false,
    createdBy: "0",
    listingId,
    listingContactId: ownerListingContactId,
    dealId: undefined,
    appointmentId: undefined,
    prospectId: undefined,
    contactId: ownerContactId,
    isActive: true,
  }).catch((error) => {
    console.error("Failed to create generate cartel task:", error);
    return null;
  });

  return {
    imageUploadTask,
    completeInfoTask,
    scheduleVisitTask,
    pickupKeysTask,
    valuationTask,
    createHojaEncargoTask,
    signedHojaEncargoTask,
    generateCartelTask,
  };
}

/**
 * Creates standard tasks for a new property listing asynchronously
 * Use this when you don't need to wait for task creation to complete
 */
export async function createPropertyTasksAsync({
  userId,
  listingId,
}: CreatePropertyTasksParams): Promise<void> {
  createPropertyTasks({ userId, listingId }).catch((error) => {
    console.error("Error creating property tasks:", error);
  });
}
