import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { feedback } from "~/server/db/schema";
import { getSecureSession } from "~/lib/dal";

export async function POST(request: NextRequest) {
  try {
    // Use optimized DAL function for session retrieval
    const session = await getSecureSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get the request body
    const body = (await request.json()) as {
      scale?: unknown;
      feedbackComment?: unknown;
      url?: unknown;
    };
    const { scale, feedbackComment, url } = body;

    console.log("Received feedback data:", { scale, feedbackComment, url });

    // Validate input
    if (!scale || !feedbackComment) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 },
      );
    }

    if (typeof scale !== "number" || scale < 1 || scale > 4) {
      return NextResponse.json(
        { error: "La calificación debe estar entre 1 y 4" },
        { status: 400 },
      );
    }

    if (
      typeof feedbackComment !== "string" ||
      feedbackComment.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "El comentario es obligatorio" },
        { status: 400 },
      );
    }

    // Validate URL if provided
    if (url !== undefined && typeof url !== "string") {
      return NextResponse.json(
        { error: "La URL debe ser una cadena de texto" },
        { status: 400 },
      );
    }

    // Get accountId from session (assuming it's available in the session)
    const accountId = session.user.accountId;

    if (!accountId) {
      return NextResponse.json(
        { error: "No se pudo obtener la información de la cuenta" },
        { status: 400 },
      );
    }

    // Insert feedback into database
    const feedbackData = {
      userId: session.user.id,
      accountId: BigInt(accountId),
      feedbackComment: feedbackComment.trim(),
      scale: scale,
      url: url && url.trim() !== "" ? url.trim() : null,
    };

    console.log("Inserting feedback data:", feedbackData);

    await db.insert(feedback).values(feedbackData);

    return NextResponse.json(
      { message: "Feedback enviado correctamente" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error saving feedback:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
