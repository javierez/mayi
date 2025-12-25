import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import { getGmailClient } from "~/lib/google-gmail";

/**
 * GET /api/google/gmail/attachment
 * Download a Gmail attachment
 *
 * Query params:
 * - messageId: The Gmail message ID
 * - attachmentId: The attachment ID within the message
 * - filename: The filename for the download
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get("messageId");
    const attachmentId = searchParams.get("attachmentId");
    const filename = searchParams.get("filename") ?? "attachment";

    if (!messageId || !attachmentId) {
      return NextResponse.json(
        { error: "messageId y attachmentId son requeridos" },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient(user.id);
    if (!gmail) {
      return NextResponse.json(
        { error: "Gmail no conectado" },
        { status: 400 }
      );
    }

    // Fetch the attachment data from Gmail API
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    const attachmentData = response.data.data;
    if (!attachmentData) {
      return NextResponse.json(
        { error: "Adjunto no encontrado" },
        { status: 404 }
      );
    }

    // Decode base64url to binary
    const base64 = attachmentData.replace(/-/g, "+").replace(/_/g, "/");
    const binaryData = Buffer.from(base64, "base64");

    // Determine content type from filename
    const contentType = getContentType(filename);

    // Return the file as a download
    return new NextResponse(binaryData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": binaryData.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error downloading attachment:", error);
    return NextResponse.json(
      { error: "Error al descargar adjunto" },
      { status: 500 }
    );
  }
}

/**
 * Get MIME type from filename extension
 */
function getContentType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  const mimeTypes: Record<string, string> = {
    // Documents
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    csv: "text/csv",
    // Images
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // Archives
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    // Other
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
  };

  return mimeTypes[ext] ?? "application/octet-stream";
}
