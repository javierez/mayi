"use server";

import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Document folder definitions with their typical document types
const DOCUMENT_FOLDERS = {
  "documentacion-inicial": {
    name: "Inicial",
    folderType: "initial-docs",
    tags: ["hoja-encargo", "valoracion", "dni", "nie", "mandato"],
    keywords: ["encargo", "valoracion", "dni", "nie", "mandato", "autorizacion"],
  },
  "documentacion-legal": {
    name: "Documentación Legal",
    folderType: "legal-docs",
    tags: ["escritura", "nota-simple", "catastro"],
    keywords: ["escritura", "nota", "simple", "catastro", "registro"],
  },
  certificados: {
    name: "Certificados",
    folderType: "certificados",
    tags: ["energy_certificate", "cedula-habitabilidad", "ite", "comunidad"],
    keywords: ["cee", "certificado", "energetico", "cedula", "habitabilidad", "ite", "comunidad"],
  },
  "impuestos-pagos": {
    name: "Impuestos y Pagos",
    folderType: "impuestos-pagos",
    tags: ["ibi", "itp", "plusvalia"],
    keywords: ["ibi", "itp", "plusvalia", "impuesto", "recibo", "pago"],
  },
  contratos: {
    name: "Contratos",
    folderType: "contratos",
    tags: ["contrato-arras", "contrato-alquiler", "escritura-compraventa"],
    keywords: ["arras", "contrato", "alquiler", "compraventa", "reserva"],
  },
  hipoteca: {
    name: "Hipoteca",
    folderType: "hipoteca",
    tags: ["deuda-pendiente", "cancelacion-registral", "tasacion"],
    keywords: ["hipoteca", "deuda", "cancelacion", "tasacion", "banco"],
  },
  planos: {
    name: "Planos",
    folderType: "planos",
    tags: ["plano"],
    keywords: ["plano", "plantas", "alzado", "cad", "dwg"],
  },
  visitas: {
    name: "Visitas",
    folderType: "visitas",
    tags: ["reporte-visita", "hoja-visita"],
    keywords: ["visita", "reporte", "ficha"],
  },
  otros: {
    name: "Otros",
    folderType: "others",
    tags: ["otro"],
    keywords: [],
  },
} as const;

interface SuggestionResult {
  suggestedFolder: string;
  suggestedFolderName: string;
  suggestedFolderType: string;
  suggestedDocumentTag: string;
  confidence: number;
}

/**
 * Try to match filename using keyword rules before calling OpenAI
 */
function matchByKeywords(filename: string): SuggestionResult | null {
  const lowerFilename = filename.toLowerCase();

  for (const [folderId, config] of Object.entries(DOCUMENT_FOLDERS)) {
    for (const keyword of config.keywords) {
      if (lowerFilename.includes(keyword)) {
        return {
          suggestedFolder: folderId,
          suggestedFolderName: config.name,
          suggestedFolderType: config.folderType,
          suggestedDocumentTag: config.tags[0] ?? folderId,
          confidence: 0.8,
        };
      }
    }
  }

  return null;
}

/**
 * POST /api/inbox/suggest-document-type
 * Suggest document type based on filename using AI
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as { filename?: string };
    const { filename } = body;

    if (!filename) {
      return NextResponse.json(
        { error: "filename es requerido" },
        { status: 400 }
      );
    }

    // First try keyword matching (faster, no API call needed)
    const keywordMatch = matchByKeywords(filename);
    if (keywordMatch) {
      return NextResponse.json(keywordMatch);
    }

    // If no keyword match, use OpenAI
    const folderDescriptions = Object.entries(DOCUMENT_FOLDERS)
      .map(([id, config]) => `- ${id}: ${config.name} (tags: ${config.tags.join(", ")})`)
      .join("\n");

    const prompt = `Analiza el nombre del archivo y sugiere la carpeta más apropiada para un documento inmobiliario.

Nombre del archivo: "${filename}"

Carpetas disponibles:
${folderDescriptions}

Responde SOLO con un JSON válido en este formato exacto (sin markdown, sin explicaciones):
{"folder": "id-de-carpeta", "tag": "tag-sugerido", "confidence": 0.0-1.0}

Si no estás seguro, usa "otros" como carpeta y "otro" como tag con confidence bajo.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un experto en clasificación de documentos inmobiliarios en España. Debes analizar nombres de archivos y sugerir la categoría más apropiada. Siempre responde con JSON válido sin formato markdown.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-4o-mini",
      temperature: 0.3,
    });

    const rawContent = completion.choices[0]?.message?.content?.trim();

    if (!rawContent) {
      // Default to "otros" if no response
      return NextResponse.json({
        suggestedFolder: "otros",
        suggestedFolderName: "Otros",
        suggestedFolderType: "others",
        suggestedDocumentTag: "otro",
        confidence: 0.3,
      });
    }

    // Parse AI response
    try {
      const parsed = JSON.parse(rawContent) as {
        folder?: string;
        tag?: string;
        confidence?: number;
      };
      const folderId = parsed.folder ?? "otros";
      const folderConfig = DOCUMENT_FOLDERS[folderId as keyof typeof DOCUMENT_FOLDERS] ?? DOCUMENT_FOLDERS.otros;

      return NextResponse.json({
        suggestedFolder: folderId,
        suggestedFolderName: folderConfig.name,
        suggestedFolderType: folderConfig.folderType,
        suggestedDocumentTag: parsed.tag ?? "otro",
        confidence: parsed.confidence ?? 0.5,
      });
    } catch {
      // If JSON parsing fails, default to "otros"
      return NextResponse.json({
        suggestedFolder: "otros",
        suggestedFolderName: "Otros",
        suggestedFolderType: "others",
        suggestedDocumentTag: "otro",
        confidence: 0.3,
      });
    }
  } catch (error) {
    console.error("Error suggesting document type:", error);
    return NextResponse.json(
      { error: "Error al sugerir tipo de documento" },
      { status: 500 }
    );
  }
}
