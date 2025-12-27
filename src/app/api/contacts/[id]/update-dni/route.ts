import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUserAccountId } from "~/lib/dal";
import { updateContact } from "~/server/queries/contact";

interface UpdateDNIRequest {
  fullName?: string;
  documentNumber?: string;
  birthDate?: string;
  expiryDate?: string;
  address?: string;
}

/**
 * POST /api/contacts/[id]/update-dni
 * Update a contact with DNI/NIE data extracted from document analysis
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accountId = await getCurrentUserAccountId();
    if (!accountId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id, 10);

    if (isNaN(contactId)) {
      return NextResponse.json(
        { error: "ID de contacto inválido" },
        { status: 400 }
      );
    }

    const body = (await request.json()) as UpdateDNIRequest;
    const { fullName, documentNumber, birthDate, expiryDate, address } = body;

    // Build the update object
    const updateData: Record<string, unknown> = {};

    // Update NIF (DNI/NIE number)
    if (documentNumber) {
      updateData.nif = documentNumber;
    }

    // Parse full name into firstName and lastName if provided
    if (fullName) {
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length === 1) {
        updateData.firstName = nameParts[0];
      } else if (nameParts.length === 2) {
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts[1];
      } else {
        // Assume first word is first name, rest is last name (common in Spain)
        updateData.firstName = nameParts[0];
        updateData.lastName = nameParts.slice(1).join(" ");
      }
    }

    // Store birthDate, expiryDate, and address in additionalInfo if provided
    const additionalInfo: Record<string, unknown> = {};

    if (birthDate) {
      additionalInfo.birthDate = birthDate;
    }

    if (expiryDate) {
      additionalInfo.dniExpiryDate = expiryDate;
    }

    if (address) {
      additionalInfo.dniAddress = address;
    }

    if (Object.keys(additionalInfo).length > 0) {
      updateData.additionalInfo = additionalInfo;
    }

    // Only proceed if we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay datos para actualizar" },
        { status: 400 }
      );
    }

    console.log("Updating contact with DNI data:", { contactId, updateData });

    // Update the contact
    await updateContact(contactId, accountId, updateData);

    return NextResponse.json({
      success: true,
      message: "Contacto actualizado con datos del DNI",
    });
  } catch (error) {
    console.error("Error updating contact with DNI data:", error);
    return NextResponse.json(
      { error: "Error al actualizar el contacto" },
      { status: 500 }
    );
  }
}
