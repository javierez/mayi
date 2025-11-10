import type { NextRequest } from "next/server";

const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

// Available endpoints:
// - /v1/ai/image-upscaler (Creative mode - base64, scale_factor: "2x")
// - /v1/ai/image-upscaler-precision (Precision v1 - base64, sharpen/smart_grain/ultra_detail)
// - /v1/ai/image-upscaler-precision-v2 (Precision v2 - URL, flavor/scale_factor)
const FREEPIK_BASE_URL = "https://api.freepik.com/v1/ai/image-upscaler-precision"; // Using Precision v1

/**
 * POST: Test Freepik API - Start upscale
 */
export async function POST(request: NextRequest) {
  try {
    const {
      imageUrl,
      sharpen = 0,
      smartGrain = 0,
      ultraDetail = 0,
      flavor = "photo",
      scaleFactor = 2,
    } = (await request.json()) as {
      imageUrl: string;
      sharpen?: number;
      smartGrain?: number;
      ultraDetail?: number;
      flavor?: string;
      scaleFactor?: number;
    };

    if (!imageUrl) {
      return Response.json({ error: "imageUrl is required" }, { status: 400 });
    }

    if (!FREEPIK_API_KEY) {
      return Response.json(
        { error: "FREEPIK_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Download and convert image to base64 (Creative API requires base64, not URL)
    console.log("📥 Downloading image for base64 conversion...");
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return Response.json(
        { error: "Failed to download image from URL" },
        { status: 400 }
      );
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    console.log("🧪 Testing Freepik API with:", {
      url: FREEPIK_BASE_URL,
      apiKeyPreview: FREEPIK_API_KEY.substring(0, 8) + "...",
      parameters: { sharpen, smartGrain, ultraDetail, flavor, scaleFactor },
      imageSizeKB: Math.round(base64Image.length / 1024),
    });

    const requestBody = {
      image: base64Image, // Precision v1 uses base64
      sharpen, // 0-100
      smart_grain: smartGrain, // 0-100
      ultra_detail: ultraDetail, // 0-100
    };

    console.log("📤 Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(FREEPIK_BASE_URL, {
      method: "POST",
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("📥 Raw response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseText,
    });

    let data: { data?: { task_id?: string; status?: string } };
    try {
      data = JSON.parse(responseText) as { data?: { task_id?: string; status?: string } };
    } catch {
      return Response.json(
        {
          error: "Invalid JSON response",
          status: response.status,
          statusText: response.statusText,
          rawResponse: responseText,
        },
        { status: response.status }
      );
    }

    if (!response.ok) {
      return Response.json(
        {
          error: "Freepik API error",
          status: response.status,
          statusText: response.statusText,
          details: data,
        },
        { status: response.status }
      );
    }

    return Response.json({
      success: true,
      taskId: data.data?.task_id,
      status: data.data?.status,
      fullResponse: data,
    });
  } catch (error) {
    console.error("❌ Test error:", error);
    return Response.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Test Freepik API - Check status or list all tasks
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const all = searchParams.get("all");

    if (!FREEPIK_API_KEY) {
      return Response.json(
        { error: "FREEPIK_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Check all tasks
    if (all === "true") {
      console.log("📋 Fetching all tasks from Freepik account");

      const response = await fetch(FREEPIK_BASE_URL, {
        method: "GET",
        headers: {
          "x-freepik-api-key": FREEPIK_API_KEY,
        },
      });

      const responseText = await response.text();
      console.log("📥 All tasks response:", {
        status: response.status,
        body: responseText,
      });

      let data: { data?: unknown[] };
      try {
        data = JSON.parse(responseText) as { data?: unknown[] };
      } catch {
        return Response.json(
          {
            error: "Invalid JSON response",
            rawResponse: responseText,
          },
          { status: response.status }
        );
      }

      return Response.json({
        tasks: data.data ?? [],
        totalTasks: data.data?.length ?? 0,
        fullResponse: data,
      });
    }

    // Check specific task
    if (!taskId) {
      return Response.json({ error: "taskId is required" }, { status: 400 });
    }

    console.log("🔍 Checking task status:", taskId);

    const response = await fetch(`${FREEPIK_BASE_URL}/${taskId}`, {
      method: "GET",
      headers: {
        "x-freepik-api-key": FREEPIK_API_KEY,
      },
    });

    const responseText = await response.text();
    console.log("📥 Status response:", {
      status: response.status,
      body: responseText,
    });

    let data: { data?: { status?: string; generated?: string[] } };
    try {
      data = JSON.parse(responseText) as { data?: { status?: string; generated?: string[] } };
    } catch {
      return Response.json(
        {
          error: "Invalid JSON response",
          rawResponse: responseText,
        },
        { status: response.status }
      );
    }

    return Response.json({
      taskId,
      status: data.data?.status,
      generated: data.data?.generated,
      fullResponse: data,
    });
  } catch (error) {
    console.error("❌ Status check error:", error);
    return Response.json(
      {
        error: "Server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
