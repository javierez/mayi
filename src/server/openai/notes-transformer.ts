"use server";

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o";

/**
 * Result type for AI transformation operations
 */
export interface TransformationResult {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Task object extracted from notes
 */
export interface ExtractedTask {
  title: string;
  description: string;
  urgency?: number; // 1-5, optional
  suggestedDueDays?: number; // Optional, default 3
  category?: "contact" | "property"; // Optional
}

/**
 * Result type for task extraction
 */
export interface TaskExtractionResult {
  success: boolean;
  tasks?: ExtractedTask[];
  error?: string;
}

/**
 * Summarize long notes into bullet points
 * Active when notes exceed 400 characters
 */
export async function summarizeNotes(notes: string): Promise<TransformationResult> {
  try {
    if (!notes || notes.trim().length === 0) {
      return {
        success: false,
        error: "Las notas no pueden estar vacías",
      };
    }

    if (notes.length <= 400) {
      return {
        success: false,
        error: "Las notas son demasiado cortas para resumir",
      };
    }

    console.log(`🔄 [AI] Summarizing notes (${notes.length} chars)...`);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un experto en analizar conversaciones inmobiliarias en español y extraer insights valiosos para agentes inmobiliarios.

Tu tarea es analizar el texto (que puede ser una transcripción de una conversación desde un solo lado) y extraer información relevante y accionable usando viñetas (•).

Extrae SOLO la información que sea relevante y valiosa. No incluyas información que el agente ya haya registrado (como detalles de propiedades que ya están en el sistema).

Prioriza extraer:
• Acciones: qué necesita pasar a continuación, quién es responsable, fechas/horarios si están mencionados
• Preguntas: sobre qué preguntó o qué le preocupa (precio, ubicación, estado, etc.)
• Preferencias: qué busca o valora (si es mencionado o inferible)
• Decisión: si hay otras personas involucradas (pareja, familia), urgencia, timeline
• Interés: solo si es MUY claramente inferible del tono y contenido (bajo/medio/alto). Si hay duda, omítelo completamente.
• Objeciones: si el cliente expresó preocupaciones específicas
• Notas personales: contexto personal útil para construir rapport (si es relevante)
• Competencia: si mencionan otras propiedades o comparaciones
• Otros: cualquier otra información relevante que no encaje en las categorías anteriores

Reglas:
- Usa viñetas (•) para cada punto
- Sé flexible: solo incluye secciones que tengan información relevante
- NO inventes ni asumas información que no esté explícita o claramente inferible del texto
- Si no estás seguro de algo, es mejor omitirlo completamente que inventarlo
- Es perfectamente válido no incluir algunas categorías si no hay suficiente información en el texto
- No repitas información que ya está registrada (detalles técnicos de propiedades, precios ya documentados)
- Prioriza insights accionables sobre hechos ya conocidos
- Sé conciso pero informativo
- Devuelve SOLO las viñetas, sin títulos de sección ni explicaciones adicionales`,
        },
        {
          role: "user",
          content: `Analiza esta conversación y extrae los insights más valiosos para el agente:\n\n${notes}`,
        },
      ],
      model: MODEL,
      temperature: 0.3,
      max_tokens: 400,
    });

    // Verify response structure
    if (!completion?.choices || completion.choices.length === 0) {
      console.error("❌ [AI] No choices in completion response");
      throw new Error("OpenAI no devolvió respuestas");
    }

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error("OpenAI no devolvió contenido");
    }

    const summary = rawContent.trim();

    console.log(`✅ [AI] Summary created`);

    return {
      success: true,
      content: summary,
    };
  } catch (error) {
    console.error("❌ [AI] Error summarizing notes:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al resumir las notas",
    };
  }
}

/**
 * Extract actionable tasks from notes
 * Active only when pending toggle is enabled
 */
export async function extractTasksFromNotes(
  notes: string,
): Promise<TaskExtractionResult> {
  try {
    if (!notes || notes.trim().length === 0) {
      return {
        success: false,
        error: "Las notas no pueden estar vacías",
      };
    }

    console.log(`🔄 [AI] Extracting tasks from notes (${notes.length} chars)...`);

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres un experto en identificar tareas accionables en conversaciones inmobiliarias en español.

Tu tarea es extraer tareas concretas y accionables del texto proporcionado.

Formato de salida (JSON estricto):
{
  "tasks": [
    {
      "title": "Título breve de la tarea (máximo 60 caracteres)",
      "description": "Descripción clara con contexto relevante",
      "urgency": 1-5 (opcional, solo si es claramente inferible: 1=baja, 2=media-baja, 3=media, 4=media-alta, 5=crítica),
      "suggestedDueDays": número de días (opcional, solo si hay fecha/horario mencionado, rango 1-90),
      "category": "contact" o "property" (opcional, solo si es claramente inferible del contexto)
    }
  ]
}

Reglas estrictas:
- Identifica SOLO tareas accionables (llamadas, envíos, visitas, documentos, seguimientos)
- Si no hay tareas accionables, devuelve array vacío: {"tasks": []}
- Cada título debe ser claro y comenzar con un verbo (Llamar, Enviar, Preparar, Programar, etc.)
- Incluye contexto relevante en la descripción (nombres, fechas, propiedades)
- Máximo 5 tareas
- NO inventes tareas que no estén implícitas en el texto
- Campos opcionales (urgency, suggestedDueDays, category): solo inclúyelos si están claramente inferibles del texto. Si hay duda, omítelos.
- suggestedDueDays: calcula basándote en fechas/horarios mencionados. Si no hay fecha, omite este campo.
- category: "contact" si la tarea es sobre comunicación con un contacto, "property" si es sobre gestión de una propiedad. Si no está claro, omite.
- Devuelve SOLO el JSON, sin explicaciones ni texto adicional`,
        },
        {
          role: "user",
          content: `Extrae las tareas accionables de estas notas:\n\n${notes}`,
        },
      ],
      model: MODEL,
      temperature: 0.2,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    // Verify response structure
    if (!completion?.choices || completion.choices.length === 0) {
      console.error("❌ [AI] No choices in completion response");
      throw new Error("OpenAI no devolvió respuestas");
    }

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      throw new Error("OpenAI no devolvió contenido");
    }

    // Parse JSON response
    let parsedResponse: { tasks: ExtractedTask[] };
    try {
      parsedResponse = JSON.parse(rawContent) as { tasks: ExtractedTask[] };
    } catch {
      console.error("❌ [AI] Failed to parse JSON response:", rawContent);
      throw new Error("Error al analizar la respuesta de OpenAI");
    }

    // Validate structure
    if (!parsedResponse.tasks || !Array.isArray(parsedResponse.tasks)) {
      console.error("❌ [AI] Invalid response structure:", parsedResponse);
      throw new Error("Estructura de respuesta inválida");
    }

    // Validate each task
    const validTasks = parsedResponse.tasks
      .filter((task) => {
        return (
          task &&
          typeof task.title === "string" &&
          task.title.trim().length > 0 &&
          task.title.length <= 60 &&
          typeof task.description === "string" &&
          task.description.trim().length > 0
        );
      })
      .map((task) => {
        // Normalize optional fields
        const normalized: ExtractedTask = {
          title: task.title.trim(),
          description: task.description.trim(),
        };

        // Validate and add optional fields if present
        if (task.urgency !== undefined) {
          const urgency = Number(task.urgency);
          if (urgency >= 1 && urgency <= 5) {
            normalized.urgency = urgency;
          }
        }

        if (task.suggestedDueDays !== undefined) {
          const days = Number(task.suggestedDueDays);
          if (days >= 1 && days <= 90) {
            normalized.suggestedDueDays = days;
          }
        }

        if (task.category === "contact" || task.category === "property") {
          normalized.category = task.category;
        }

        return normalized;
      });

    console.log(`✅ [AI] Extracted ${validTasks.length} tasks`);

    return {
      success: true,
      tasks: validTasks,
    };
  } catch (error) {
    console.error("❌ [AI] Error extracting tasks:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al extraer tareas",
    };
  }
}
