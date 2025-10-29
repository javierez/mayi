import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const model = (formData.get("model") as string) ?? "gpt-4o-transcribe";
    const language = formData.get("language") as string;
    const responseFormat = formData.get("response_format") as string;
    const prompt = formData.get("prompt") as string;
    const stream = formData.get("stream") === "true";
    const timestampGranularities = formData.get("timestamp_granularities") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    console.log("Transcribing audio:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      model,
      language: language ?? "es",
      responseFormat: responseFormat ?? "json",
      hasPrompt: Boolean(prompt),
      stream,
    });

    // Convert File to Buffer for OpenAI SDK
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create a File-like object that OpenAI SDK expects
    const audioFile = new File([buffer], file.name, { type: file.type });

    // Build transcription options
    interface TranscriptionOptions {
      file: File;
      model: string;
      response_format: "json" | "text" | "srt" | "verbose_json" | "vtt";
      language?: string;
      prompt?: string;
      timestamp_granularities?: string[];
    }

    const options: TranscriptionOptions = {
      file: audioFile,
      model,
      response_format: (responseFormat as "json" | "text" | "srt" | "verbose_json" | "vtt") ?? "json",
    };

    // Add language if provided
    if (language) {
      options.language = language;
    }

    // Add prompt if provided (not supported for diarize models)
    if (prompt && !model.includes("diarize")) {
      options.prompt = prompt;
    }

    // Add timestamp granularities for whisper-1
    if (model === "whisper-1" && timestampGranularities) {
      options.timestamp_granularities = timestampGranularities.split(",");
    }

    // Handle streaming
    if (stream && model !== "whisper-1") {
      const transcriptionStream = (await openai.audio.transcriptions.create({
        ...options,
        stream: true,
      } as Parameters<typeof openai.audio.transcriptions.create>[0])) as unknown as AsyncIterable<unknown>;

      // Create a readable stream for the response
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of transcriptionStream) {
              const data = `data: ${JSON.stringify(event)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming transcription
    const transcription = await openai.audio.transcriptions.create(
      options as Parameters<typeof openai.audio.transcriptions.create>[0]
    );

    console.log("Transcription successful");

    return NextResponse.json(transcription);
  } catch (error: unknown) {
    console.error("Whisper transcription error:", error);

    if (error instanceof OpenAI.APIError) {
      const errorStatus = typeof error.status === "number" ? error.status : 500;
      return NextResponse.json(
        {
          error: error.message,
          type: String(error.type ?? "unknown")
        },
        { status: errorStatus }
      );
    }

    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
