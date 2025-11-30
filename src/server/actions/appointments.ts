"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAccountId, getCurrentUser } from "~/lib/dal";
import {
  createAppointment,
  updateAppointment,
  // getUserAppointments, // Unused - keeping for future use
  // getAppointmentsByDateRange, // Unused - keeping for future use
  getAgentsForFilter,
  getUserAppointmentsSecure,
  getAppointmentsByDateRangeSecure,
  getListingAppointments,
  softDeleteAppointment,
  getAppointmentByIdWithAuth,
} from "~/server/queries/appointment";
import { findOrCreateLeadForAppointment } from "~/server/queries/lead-status-sync";
import { syncToGoogle } from "~/lib/google-calendar-sync";
import { getAppointmentTasksWithAuth } from "~/server/queries/task";

// Form data structure from PRP
interface AppointmentFormData {
  contactId?: bigint;
  listingId?: bigint;
  listingContactId?: bigint;
  dealId?: bigint;
  prospectId?: bigint;
  startDate: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endDate: string; // YYYY-MM-DD format
  endTime: string; // HH:mm format
  tripTimeMinutes?: number;
  title: string;
  notes?: string;
  appointmentType: "Visita" | "Reunión" | "Firma" | "Cierre" | "Viaje" | "Tarea";
  assignedTo?: string; // FK → users.id (who is assigned to the appointment)
}

// Server action for appointment update
export async function updateAppointmentAction(
  appointmentId: bigint,
  formData: AppointmentFormData,
) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    // CRITICAL: Convert form data to database format
    const appointmentData = {
      userId: currentUser.id, // String for BetterAuth
      contactId: formData.contactId ? BigInt(formData.contactId) : undefined,
      listingId: formData.listingId ? BigInt(formData.listingId) : undefined,
      listingContactId: formData.listingContactId
        ? BigInt(formData.listingContactId)
        : undefined,
      dealId: formData.dealId ? BigInt(formData.dealId) : undefined,
      prospectId: formData.prospectId ? BigInt(formData.prospectId) : undefined,
      datetimeStart: new Date(`${formData.startDate}T${formData.startTime}`),
      datetimeEnd: new Date(`${formData.endDate}T${formData.endTime}`),
      tripTimeMinutes: formData.tripTimeMinutes,
      status: "Scheduled" as const,
      title: formData.title,
      notes: formData.notes,
      type: formData.appointmentType,
      assignedTo: formData.assignedTo,
      editedBy: currentUser.id, // Track who edited the appointment
      isActive: true,
    };

    // Validate appointment times
    if (appointmentData.datetimeStart >= appointmentData.datetimeEnd) {
      return {
        success: false,
        error: "La hora de fin debe ser posterior a la hora de inicio",
      };
    }

    // PATTERN: Use existing query function
    console.log(
      "Updating appointment with ID:",
      appointmentId,
      "and data:",
      appointmentData,
    );
    const result = await updateAppointment(
      Number(appointmentId),
      appointmentData,
    );
    console.log("Update result:", result);

    if (!result) {
      return {
        success: false,
        error: "Error al actualizar la cita",
      };
    }

    // NEW: Sync to Google Calendar after successful appointment update
    // Sync to assignee's calendar (if assigned), otherwise creator's
    const syncUserId = formData.assignedTo ?? currentUser.id;
    try {
      await syncToGoogle(syncUserId, appointmentId, "update");
    } catch (error) {
      console.error(
        "Failed to sync appointment update to Google Calendar:",
        error,
      );
      // Don't fail the appointment update if Google Calendar sync fails
    }

    // Refresh calendar data
    revalidatePath("/calendario");

    return {
      success: true,
      appointmentId: result.appointmentId,
    };
  } catch (error) {
    console.error("Failed to update appointment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar la cita",
    };
  }
}

// Server action for appointment creation
export async function createAppointmentAction(formData: AppointmentFormData) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    // CRITICAL: Convert form data to database format
    const appointmentData = {
      userId: currentUser.id, // String for BetterAuth
      contactId: formData.contactId ? BigInt(formData.contactId) : null,
      listingId: formData.listingId ? BigInt(formData.listingId) : undefined,
      listingContactId: formData.listingContactId
        ? BigInt(formData.listingContactId)
        : undefined,
      dealId: formData.dealId ? BigInt(formData.dealId) : undefined,
      prospectId: formData.prospectId ? BigInt(formData.prospectId) : undefined,
      datetimeStart: new Date(`${formData.startDate}T${formData.startTime}`),
      datetimeEnd: new Date(`${formData.endDate}T${formData.endTime}`),
      tripTimeMinutes: formData.tripTimeMinutes,
      status: "Scheduled" as const,
      title: formData.title,
      notes: formData.notes,
      type: formData.appointmentType,
      assignedTo: formData.assignedTo,
      isActive: true,
    };

    // Validate appointment times
    if (appointmentData.datetimeStart >= appointmentData.datetimeEnd) {
      return {
        success: false,
        error: "La hora de fin debe ser posterior a la hora de inicio",
      };
    }

    // NEW: Auto-create lead if missing and we have required data
    if (!appointmentData.listingContactId && appointmentData.contactId) {
      try {
        const { listingContactId: autoCreatedListingContactId, created } =
          await findOrCreateLeadForAppointment(
            appointmentData.contactId,
            appointmentData.listingId,
            appointmentData.prospectId,
          );
        appointmentData.listingContactId = autoCreatedListingContactId;

        console.log("🎯 Lead auto-creation result:", {
          listingContactId: autoCreatedListingContactId.toString(),
          created,
          contactId: appointmentData.contactId.toString(),
          listingId: appointmentData.listingId?.toString(),
        });
      } catch (error) {
        console.error("Failed to auto-create lead for appointment:", error);
        // Don't fail the appointment creation if lead creation fails
        // This ensures appointment creation is resilient
      }
    }

    // PATTERN: Use existing query function
    console.log("📝 Creating appointment with data:", {
      ...appointmentData,
      listingId: appointmentData.listingId?.toString(),
      contactId: appointmentData.contactId?.toString(),
      formDataListingId: formData.listingId?.toString(),
    });

    const result = await createAppointment(appointmentData);

    console.log("📋 Created appointment result:", {
      success: !!result,
      appointmentId: result?.appointmentId?.toString(),
      listingId: result?.listingId?.toString(),
    });

    if (!result) {
      return {
        success: false,
        error: "Error al crear la cita",
      };
    }

    // Lead status is already set to "Cita Pendiente" during creation
    // No need to update it again

    // NEW: Sync to Google Calendar after successful appointment creation
    // Sync to assignee's calendar (if assigned), otherwise creator's
    const syncUserId = formData.assignedTo ?? currentUser.id;
    try {
      await syncToGoogle(syncUserId, result.appointmentId, "create");
    } catch (error) {
      console.error("Failed to sync appointment to Google Calendar:", error);
      // Don't fail the appointment creation if Google Calendar sync fails
    }

    // Refresh calendar data
    revalidatePath("/calendario");

    return {
      success: true,
      appointmentId: result.appointmentId,
    };
  } catch (error) {
    console.error("Failed to create appointment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al crear la cita",
    };
  }
}

// Server action to get user appointments for calendar
export async function getUserAppointmentsAction() {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    const appointments = await getUserAppointmentsSecure(currentUser.id);

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error("Failed to fetch user appointments:", error);
    return {
      success: false,
      error: "Error al obtener las citas",
      appointments: [],
    };
  }
}

// Server action to get appointments by date range
export async function getAppointmentsByDateRangeAction(
  startDate: Date,
  endDate: Date,
  filterByUserIds?: string[],
) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();

    const appointments = await getAppointmentsByDateRangeSecure(
      startDate,
      endDate,
      filterByUserIds,
    );

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error("Failed to fetch appointments by date range:", error);
    return {
      success: false,
      error: "Error al obtener las citas por rango de fechas",
      appointments: [],
    };
  }
}

// Validate appointment form data
export async function validateAppointmentForm(
  formData: Partial<AppointmentFormData>,
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // contactId is now optional - appointments can be internal/personal without a contact

  if (!formData.startDate) {
    errors.push("Debe seleccionar una fecha de inicio");
  }

  if (!formData.startTime) {
    errors.push("Debe seleccionar una hora de inicio");
  }

  if (!formData.endTime) {
    errors.push("Debe seleccionar una hora de fin");
  }

  if (!formData.appointmentType) {
    errors.push("Debe seleccionar un tipo de cita");
  }

  // Title is auto-generated, so we don't need to validate it
  // If it's missing, we'll generate it on the client side before submission

  // Validate time logic
  if (
    formData.startDate &&
    formData.endDate &&
    formData.startTime &&
    formData.endTime
  ) {
    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`,
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (startDateTime >= endDateTime) {
      errors.push("La hora de fin debe ser posterior a la hora de inicio");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Server action to get agents for filtering
export async function getAgentsForFilterAction() {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();

    const agents = await getAgentsForFilter();

    return {
      success: true,
      agents,
    };
  } catch (error) {
    console.error("Failed to fetch agents for filter:", error);
    return {
      success: false,
      error: "Error al obtener los agentes",
      agents: [],
    };
  }
}

// Server action to update appointment status only
export async function updateAppointmentStatusAction(
  appointmentId: bigint,
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled" | "NoShow",
  listingId?: bigint,
  contactId?: bigint,
) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    // Get the current appointment to preserve other fields
    const appointment = await updateAppointment(Number(appointmentId), {
      status,
      editedBy: currentUser.id,
    } as Parameters<typeof updateAppointment>[1]);

    if (!appointment) {
      return {
        success: false,
        error: "Error al actualizar el estado de la cita",
      };
    }

    // Sync to Google Calendar after status update
    try {
      await syncToGoogle(currentUser.id, appointmentId, "update");
    } catch (error) {
      console.error(
        "Failed to sync appointment status update to Google Calendar:",
        error,
      );
      // Don't fail the status update if Google Calendar sync fails
    }

    // Refresh calendar data
    revalidatePath("/calendario");

    // Refresh property page if listingId is provided or available from appointment
    if (listingId ?? appointment.listingId) {
      revalidatePath(`/propiedades/${listingId ?? appointment.listingId}`);
    }

    // Refresh contact page if contactId is provided or available from appointment
    if (contactId ?? appointment.contactId) {
      revalidatePath(`/contactos/${contactId ?? appointment.contactId}`);
    }

    return {
      success: true,
      appointmentId: appointment.appointmentId,
    };
  } catch (error) {
    console.error("Failed to update appointment status:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar el estado de la cita",
    };
  }
}

// Server action to update appointment title only
export async function updateAppointmentTitleAction(
  appointmentId: bigint,
  title: string,
) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    const appointment = await updateAppointment(Number(appointmentId), {
      title,
      editedBy: currentUser.id,
    } as Parameters<typeof updateAppointment>[1]);

    if (!appointment) {
      return {
        success: false,
        error: "Error al actualizar el título de la cita",
      };
    }

    // Refresh calendar data
    revalidatePath("/calendario");

    return {
      success: true,
      appointmentId: appointment.appointmentId,
    };
  } catch (error) {
    console.error("Failed to update appointment title:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al actualizar el título",
    };
  }
}

// Server action to get appointments for a specific listing
export async function getListingAppointmentsAction(listingId: number) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();

    const appointments = await getListingAppointments(listingId);

    return {
      success: true,
      appointments,
    };
  } catch (error) {
    console.error("Failed to fetch listing appointments:", error);
    return {
      success: false,
      error: "Error al obtener las citas de la propiedad",
      appointments: [],
    };
  }
}

// Server action to get tasks for a specific appointment
export async function getAppointmentTasksAction(appointmentId: number) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();

    const tasks = await getAppointmentTasksWithAuth(appointmentId);

    return {
      success: true,
      tasks,
    };
  } catch (error) {
    console.error("Failed to fetch appointment tasks:", error);
    return {
      success: false,
      error: "Error al obtener las tareas de la cita",
      tasks: [],
    };
  }
}

// Server action to get tasks for multiple appointments (batch fetch)
export async function getBatchAppointmentTasksAction(appointmentIds: number[]) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();

    // Fetch tasks for all appointments in parallel
    const tasksPromises = appointmentIds.map(async (appointmentId) => {
      try {
        const tasks = await getAppointmentTasksWithAuth(appointmentId);
        return {
          appointmentId,
          tasks,
        };
      } catch (error) {
        console.error(
          `Failed to fetch tasks for appointment ${appointmentId}:`,
          error,
        );
        return {
          appointmentId,
          tasks: [],
        };
      }
    });

    const results = await Promise.all(tasksPromises);

    // Convert to a map for easy lookup
    const tasksMap = new Map<number, (typeof results)[0]["tasks"]>();
    results.forEach(({ appointmentId, tasks }) => {
      tasksMap.set(appointmentId, tasks);
    });

    return {
      success: true,
      tasksMap: Object.fromEntries(tasksMap),
    };
  } catch (error) {
    console.error("Failed to batch fetch appointment tasks:", error);
    return {
      success: false,
      error: "Error al obtener las tareas de las citas",
      tasksMap: {},
    };
  }
}

// Server action to delete an appointment
export async function deleteAppointmentAction(
  appointmentId: bigint,
  listingId?: bigint,
  contactId?: bigint,
) {
  try {
    // PATTERN: Always get account ID for security
    await getCurrentUserAccountId();
    const currentUser = await getCurrentUser();

    // Fetch the appointment to get listingId and contactId if not provided
    const appointment = await getAppointmentByIdWithAuth(Number(appointmentId));

    // Soft delete the appointment (sets isActive = false)
    await softDeleteAppointment(Number(appointmentId));

    // Sync deletion to Google Calendar
    // Sync to assignee's calendar (if assigned), otherwise creator's
    const syncUserId = appointment?.appointments.assignedTo ?? currentUser.id;
    try {
      await syncToGoogle(syncUserId, appointmentId, "delete");
    } catch (error) {
      console.error(
        "Failed to sync appointment deletion to Google Calendar:",
        error,
      );
      // Don't fail the delete operation if Google Calendar sync fails
    }

    // Refresh calendar data
    revalidatePath("/calendario");

    // Refresh property page if listingId is provided or available from appointment
    const appointmentListingId = appointment?.appointments.listingId;
    if (listingId ?? appointmentListingId) {
      revalidatePath(`/propiedades/${listingId ?? appointmentListingId}`);
    }

    // Refresh contact page if contactId is provided or available from appointment
    const appointmentContactId = appointment?.appointments.contactId;
    if (contactId ?? appointmentContactId) {
      revalidatePath(`/contactos/${contactId ?? appointmentContactId}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Failed to delete appointment:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar la cita",
    };
  }
}
