"use server";

import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Document types available for each folder
const DOCUMENT_TYPES_BY_FOLDER: Record<
  string,
  Array<{ id: string; name: string; description: string; keywords: string[] }>
> = {
  "documentacion-inicial": [
    {
      id: "documentacion-inicial",
      name: "Documentación Inicial",
      description: "DNI/NIE, valoración",
      keywords: ["dni", "nie", "valoracion", "inicial"],
    },
    {
      id: "hoja-encargo",
      name: "Hoja de Encargo",
      description: "Contrato de encargo firmado",
      keywords: ["encargo", "mandato", "autorizacion"],
    },
  ],
  "documentacion-legal": [
    {
      id: "documentacion-legal",
      name: "Documentación Legal",
      description: "Nota simple, escritura",
      keywords: ["nota", "simple", "escritura", "registro", "legal"],
    },
  ],
  certificados: [
    {
      id: "certificados",
      name: "Certificado General",
      description: "Certificados varios",
      keywords: ["certificado", "general"],
    },
    {
      id: "energy_certificate",
      name: "Certificado Energético (CEE)",
      description: "Certificado de eficiencia",
      keywords: ["cee", "energetico", "eficiencia", "energy"],
    },
    {
      id: "cedula-habitabilidad",
      name: "Cédula de Habitabilidad",
      description: "Licencia de ocupación",
      keywords: ["cedula", "habitabilidad", "ocupacion", "licencia"],
    },
    {
      id: "ite",
      name: "ITE",
      description: "Inspección técnica del edificio",
      keywords: ["ite", "inspeccion", "tecnica", "edificio"],
    },
  ],
  "impuestos-pagos": [
    {
      id: "impuestos-pagos",
      name: "Impuesto General",
      description: "Impuestos varios",
      keywords: ["impuesto", "pago", "recibo"],
    },
    {
      id: "ibi",
      name: "IBI",
      description: "Impuesto sobre bienes inmuebles",
      keywords: ["ibi", "bienes", "inmuebles"],
    },
    {
      id: "itp",
      name: "ITP",
      description: "Impuesto de transmisiones",
      keywords: ["itp", "transmisiones", "patrimoniales"],
    },
    {
      id: "plusvalia",
      name: "Plusvalía",
      description: "Plusvalía municipal",
      keywords: ["plusvalia", "municipal"],
    },
  ],
  contratos: [
    {
      id: "contratos",
      name: "Contrato General",
      description: "Contratos varios",
      keywords: ["contrato", "general"],
    },
    {
      id: "contrato-arras",
      name: "Contrato de Arras",
      description: "Señal/arras",
      keywords: ["arras", "senal", "reserva"],
    },
    {
      id: "contrato-alquiler",
      name: "Contrato de Alquiler",
      description: "Arrendamiento",
      keywords: ["alquiler", "arrendamiento", "renta"],
    },
  ],
  hipoteca: [
    {
      id: "hipoteca",
      name: "Hipoteca",
      description: "Documentación hipotecaria",
      keywords: ["hipoteca", "banco", "prestamo"],
    },
    {
      id: "cancelacion-registral",
      name: "Cancelación Registral",
      description: "Cancelación de hipoteca",
      keywords: ["cancelacion", "registral"],
    },
  ],
  planos: [
    {
      id: "planos",
      name: "Planos",
      description: "Planos de la propiedad",
      keywords: ["plano", "planta", "alzado", "cad", "dwg"],
    },
  ],
  visitas: [
    {
      id: "visitas",
      name: "Reporte de Visita",
      description: "Informe de visita",
      keywords: ["visita", "reporte", "informe"],
    },
  ],
  otros: [
    {
      id: "otros",
      name: "Otro Documento",
      description: "Documentos varios",
      keywords: [],
    },
  ],
  "documentos-personales": [
    {
      id: "documentos-personales",
      name: "Documento Personal",
      description: "DNI, NIE, pasaporte",
      keywords: ["personal", "dni", "nie", "pasaporte"],
    },
  ],
  escrituras: [
    {
      id: "escrituras",
      name: "Escritura",
      description: "Escrituras y notas simples",
      keywords: ["escritura", "nota", "simple"],
    },
  ],
  carteles: [
    {
      id: "carteles",
      name: "Cartel",
      description: "Carteles de la propiedad",
      keywords: ["cartel", "poster", "anuncio"],
    },
  ],
  "certificado-energetico": [
    {
      id: "energy_certificate",
      name: "Certificado Energético",
      description: "CEE",
      keywords: ["cee", "energetico", "eficiencia"],
    },
  ],
};

interface TypeSuggestionResult {
  suggestedDocumentTag: string;
  suggestedDocumentTagName: string;
  confidence: number;
}

/**
 * Try to match filename using keyword rules before calling OpenAI
 */
function matchByKeywords(
  filename: string,
  folderId: string
): TypeSuggestionResult | null {
  const types = DOCUMENT_TYPES_BY_FOLDER[folderId];
  if (!types || types.length === 0) return null;

  const lowerFilename = filename.toLowerCase();

  for (const docType of types) {
    for (const keyword of docType.keywords) {
      if (lowerFilename.includes(keyword)) {
        return {
          suggestedDocumentTag: docType.id,
          suggestedDocumentTagName: docType.name,
          confidence: 0.8,
        };
      }
    }
  }

  return null;
}

/**
 * POST /api/inbox/suggest-document-tag
 * Suggest document type within a folder based on filename using AI
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = (await request.json()) as {
      filename?: string;
      folderId?: string;
    };
    const { filename, folderId } = body;

    if (!filename || !folderId) {
      return NextResponse.json(
        { error: "filename y folderId son requeridos" },
        { status: 400 }
      );
    }

    const types = DOCUMENT_TYPES_BY_FOLDER[folderId];
    if (!types || types.length === 0) {
      // No types defined for this folder, return the folder as the tag
      return NextResponse.json({
        suggestedDocumentTag: folderId,
        suggestedDocumentTagName: folderId,
        confidence: 0.5,
      });
    }

    // Get first type as fallback (guaranteed to exist since we checked length > 0)
    const firstType = types[0]!;

    // If only one type in folder, return it immediately
    if (types.length === 1) {
      return NextResponse.json({
        suggestedDocumentTag: firstType.id,
        suggestedDocumentTagName: firstType.name,
        confidence: 1.0,
      });
    }

    // First try keyword matching (faster, no API call needed)
    const keywordMatch = matchByKeywords(filename, folderId);
    if (keywordMatch) {
      return NextResponse.json(keywordMatch);
    }

    // If no keyword match, use OpenAI
    const typeDescriptions = types
      .map((t) => `- ${t.id}: ${t.name} (${t.description})`)
      .join("\n");

    const prompt = `Analiza el nombre del archivo y sugiere el tipo de documento más apropiado dentro de esta categoría.

Nombre del archivo: "${filename}"

Tipos de documento disponibles:
${typeDescriptions}

Responde SOLO con un JSON válido en este formato exacto (sin markdown, sin explicaciones):
{"tag": "id-del-tipo", "confidence": 0.0-1.0}

Si no estás seguro, usa el primer tipo de la lista con confidence bajo.`;

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un experto en clasificación de documentos inmobiliarios en España. Debes analizar nombres de archivos y sugerir el tipo de documento más apropiado. Siempre responde con JSON válido sin formato markdown.`,
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
      // Default to first type if no response
      return NextResponse.json({
        suggestedDocumentTag: firstType.id,
        suggestedDocumentTagName: firstType.name,
        confidence: 0.3,
      });
    }

    // Parse AI response
    try {
      const parsed = JSON.parse(rawContent) as {
        tag?: string;
        confidence?: number;
      };
      const tagId = parsed.tag ?? firstType.id;
      const matchedType = types.find((t) => t.id === tagId) ?? firstType;

      return NextResponse.json({
        suggestedDocumentTag: matchedType.id,
        suggestedDocumentTagName: matchedType.name,
        confidence: parsed.confidence ?? 0.5,
      });
    } catch {
      // If JSON parsing fails, default to first type
      return NextResponse.json({
        suggestedDocumentTag: firstType.id,
        suggestedDocumentTagName: firstType.name,
        confidence: 0.3,
      });
    }
  } catch (error) {
    console.error("Error suggesting document tag:", error);
    return NextResponse.json(
      { error: "Error al sugerir tipo de documento" },
      { status: 500 }
    );
  }
}
