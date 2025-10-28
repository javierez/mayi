import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_RENOVATION_SETTINGS,
  getAssemblyRenovationPrompt,
  ROOM_DETECTION_PROMPT,
  ROOM_ASSEMBLY_PROMPTS,
  type GeminiRenovationResponse,
  type RenovationType,
  type RenovationStyle,
  type RoomDetectionResponse,
} from "~/types/gemini";

// Environment validation function (called at runtime, not module load)
function validateEnvironment() {
  const requiredEnvVars = {
    GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
  };

  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required Gemini environment variables: ${missingEnvVars.join(", ")}`,
    );
  }
}

class GeminiClient {
  private genAI: GoogleGenAI;

  constructor() {
    validateEnvironment();
    this.genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GEMINI_API_KEY!,
    });
  }

  /**
   * Detect room type from image analysis using Gemini API
   * Uses gemini-2.5-flash model for intelligent room recognition
   */
  async detectRoomType(imageBase64: string): Promise<RoomDetectionResponse> {
    try {
      console.log("Starting Gemini room detection:", {
        model: "gemini-2.5-flash",
        imageDataLength: imageBase64.length,
      });

      // Clean base64 string (remove data URL prefix if present)
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Prepare the content array with room detection prompt and image
      const contents = [
        { text: ROOM_DETECTION_PROMPT },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
      ];

      // Call Gemini API for room detection
      const model = this.genAI.models.generateContent({
        model: "gemini-2.5-flash", // Use standard model for room detection
        contents,
      });

      const response = await model;

      console.log("Gemini room detection response received:", {
        candidatesCount: response.candidates?.length ?? 0,
        hasContent: !!response.candidates?.[0]?.content,
      });

      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No content returned from Gemini room detection API");
      }

      // Extract text response
      const textParts = response.candidates[0].content.parts.filter(
        (part) => part.text,
      );
      if (textParts.length === 0) {
        throw new Error("No text response found in Gemini room detection");
      }

      const detectedRoomText = textParts[0]?.text?.trim().toLowerCase();
      console.log("Raw room detection response:", detectedRoomText);

      // Parse and validate the detected room type
      const validRoomTypes: RenovationType[] = [
        "living_room",
        "bedroom",
        "bathroom",
        "entrance_hall",
        "terrace",
        "balcony",
        "kitchen",
        "dining_room",
      ];

      // Find matching room type (handle variations in response)
      let detectedRoomType: RenovationType | undefined;
      for (const roomType of validRoomTypes) {
        if (
          detectedRoomText?.includes(roomType.replace("_", " ")) ||
          detectedRoomText?.includes(roomType)
        ) {
          detectedRoomType = roomType;
          break;
        }
      }

      if (!detectedRoomType) {
        console.warn(
          "Could not parse room type from response:",
          detectedRoomText,
        );
        // Fallback to living_room for unrecognized rooms
        detectedRoomType = "living_room";
      }

      console.log("Room detection successful:", {
        detectedType: detectedRoomType,
        rawResponse: detectedRoomText,
      });

      return {
        success: true,
        roomType: detectedRoomType,
        confidence: 0.8, // Default confidence for successful detection
      };
    } catch (error) {
      console.error("Gemini room detection error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // NOTE: Old renovateImage method removed - use renovateImageWithAssembly instead

  /**
   * Generate renovation image using assembly prompts for specific room elements
   * Allows targeting specific furniture/elements within a room
   */
  async renovateImageWithAssembly(
    imageBase64: string,
    roomType: RenovationType,
    selectedElements?: string[],
    style: RenovationStyle = "default",
  ): Promise<GeminiRenovationResponse> {
    try {
      const prompt = getAssemblyRenovationPrompt(
        roomType,
        selectedElements,
        style,
      );

      console.log(
        "🎨 USING ASSEMBLY PROMPTS - Gemini API renovation request:",
        {
          model: GEMINI_RENOVATION_SETTINGS.model,
          roomType,
          selectedElements: selectedElements ?? "all elements",
          style,
          promptType: "ASSEMBLY",
          promptPreview: prompt.substring(0, 200) + "...",
          imageDataLength: imageBase64.length,
        },
      );

      // Log the full prompt for debugging
      console.log("📝 FULL ASSEMBLY PROMPT BEING USED:");
      console.log("==========================================");
      console.log(prompt);
      console.log("==========================================");

      // Clean base64 string (remove data URL prefix if present)
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Prepare the content array with assembly prompt and image
      const contents = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
      ];

      // Call Gemini API
      const model = this.genAI.models.generateContent({
        model: GEMINI_RENOVATION_SETTINGS.model,
        contents,
      });

      const response = await model;

      console.log("Gemini API assembly renovation response received:", {
        candidatesCount: response.candidates?.length ?? 0,
        hasContent: !!response.candidates?.[0]?.content,
      });

      // Process response to find generated image
      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No content returned from Gemini API");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;

          console.log("Generated assembly renovation image found:", {
            mimeType: part.inlineData.mimeType,
            dataLength: imageData?.length ?? 0,
          });

          return {
            success: true,
            renovatedImageBase64: imageData,
          };
        }
      }

      // If no image data found, check for text response that might contain error info
      const textParts = response.candidates[0].content.parts.filter(
        (part) => part.text,
      );
      if (textParts.length > 0) {
        console.log(
          "Gemini assembly renovation text response:",
          textParts[0]?.text,
        );
        throw new Error(
          "Gemini API returned text instead of image. Response: " +
            textParts[0]?.text,
        );
      }

      throw new Error("No image data found in Gemini API response");
    } catch (error) {
      console.error("Gemini assembly renovation error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get available elements for a specific room type and style
   */
  getRoomElements(
    roomType: RenovationType,
    style: RenovationStyle = "default",
  ): string[] {
    return ROOM_ASSEMBLY_PROMPTS[style][roomType].assembled_elements;
  }

  /**
   * Validate image format and size for Gemini API
   */
  validateImageInput(imageBase64: string): { valid: boolean; error?: string } {
    try {
      // Check if it's a valid base64 string
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return { valid: false, error: "Invalid image data format" };
      }

      // Remove data URL prefix if present for size calculation
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Check base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
        return { valid: false, error: "Invalid base64 format" };
      }

      // Calculate approximate file size (base64 is ~33% larger than original)
      const sizeInBytes = (cleanBase64.length * 3) / 4;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      // Gemini has a 20MB limit for images
      if (sizeInMB > 20) {
        return {
          valid: false,
          error: `Image too large (${sizeInMB.toFixed(2)}MB). Maximum size is 20MB`,
        };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "Failed to validate image input" };
    }
  }
}

// Export a lazy-loaded singleton instance
let clientInstance: GeminiClient | null = null;

export const geminiClient = {
  get instance(): GeminiClient {
    clientInstance ??= new GeminiClient();
    return clientInstance;
  },

  // Proxy methods to the actual client
  renovateImageWithAssembly: (
    imageBase64: string,
    roomType: RenovationType,
    selectedElements?: string[],
    style: RenovationStyle = "default",
  ) =>
    geminiClient.instance.renovateImageWithAssembly(
      imageBase64,
      roomType,
      selectedElements,
      style,
    ),

  getRoomElements: (
    roomType: RenovationType,
    style: RenovationStyle = "default",
  ) => geminiClient.instance.getRoomElements(roomType, style),

  detectRoomType: (imageBase64: string) =>
    geminiClient.instance.detectRoomType(imageBase64),

  validateImageInput: (imageBase64: string) =>
    geminiClient.instance.validateImageInput(imageBase64),
};

// Also export the class for testing purposes
export { GeminiClient };
