import { GoogleGenAI } from "@google/genai";
import {
  GEMINI_RENOVATION_SETTINGS,
  getAssemblyRenovationPrompt,
  ROOM_DETECTION_PROMPT,
  ROOM_ASSEMBLY_PROMPTS,
  BEDROOM_OBJECT_REMOVAL_PROMPT,
  BLUR_FACES_PROMPT,
  REMOVE_CLUTTER_PROMPT,
  type GeminiRenovationResponse,
  type RenovationType,
  type RenovationStyle,
  type RoomDetectionResponse,
  type RenovationReviewResponse,
} from "~/types/gemini";

// Type for Gemini API usage metadata
interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

// Type for Gemini API response with usage metadata
interface GeminiResponseWithUsage {
  usageMetadata?: GeminiUsageMetadata;
  candidates?: unknown[];
}

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

      // Extract token usage from response
      const responseWithUsage = response as GeminiResponseWithUsage;
      const usageMetadata = responseWithUsage.usageMetadata;
      const tokenUsage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount ?? 0,
            candidatesTokenCount: usageMetadata.candidatesTokenCount ?? 0,
            totalTokenCount: usageMetadata.totalTokenCount ?? 0,
          }
        : null;

      if (tokenUsage) {
        console.log("📊 ROOM DETECTION - Token Usage:", {
          promptTokens: tokenUsage.promptTokenCount,
          candidatesTokens: tokenUsage.candidatesTokenCount,
          totalTokens: tokenUsage.totalTokenCount,
        });
      }

      console.log("Gemini room detection response received:", {
        candidatesCount: response.candidates?.length ?? 0,
        hasContent: !!response.candidates?.[0]?.content,
        tokenUsage,
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
   * Remove all objects from bedroom image (first pass for bedrooms)
   * Returns empty room structure preserving all geometry
   */
  async removeBedroomObjects(
    imageBase64: string,
  ): Promise<GeminiRenovationResponse> {
    try {
      console.log("🛏️ BEDROOM OBJECT REMOVAL - First pass:", {
        model: GEMINI_RENOVATION_SETTINGS.model,
        promptType: "OBJECT_REMOVAL",
        imageDataLength: imageBase64.length,
      });

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Prepare content with removal prompt and image
      const contents = [
        { text: BEDROOM_OBJECT_REMOVAL_PROMPT },
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
        config: {
          temperature: GEMINI_RENOVATION_SETTINGS.temperature,
          maxOutputTokens: GEMINI_RENOVATION_SETTINGS.maxOutputTokens,
        },
      });

      const response = await model;

      // Extract token usage from response
      const responseWithUsage = response as GeminiResponseWithUsage;
      const usageMetadata = responseWithUsage.usageMetadata;
      const tokenUsage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount ?? 0,
            candidatesTokenCount: usageMetadata.candidatesTokenCount ?? 0,
            totalTokenCount: usageMetadata.totalTokenCount ?? 0,
          }
        : null;

      if (tokenUsage) {
        console.log("📊 BEDROOM OBJECT REMOVAL - Token Usage:", {
          promptTokens: tokenUsage.promptTokenCount,
          candidatesTokens: tokenUsage.candidatesTokenCount,
          totalTokens: tokenUsage.totalTokenCount,
        });
      }

      // Process response to find generated image
      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No content returned from Gemini API");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          console.log("✅ Bedroom object removal successful:", {
            mimeType: part.inlineData.mimeType,
            dataLength: imageData?.length ?? 0,
            tokenUsage,
          });

          return {
            success: true,
            renovatedImageBase64: imageData,
            tokenUsage: tokenUsage ?? undefined, // Include token usage in response
          };
        }
      }

      // If no image data found, check for text response
      const textParts = response.candidates[0].content.parts.filter(
        (part) => part.text,
      );
      if (textParts.length > 0) {
        console.log("Gemini object removal text response:", textParts[0]?.text);
        throw new Error(
          "Gemini API returned text instead of image. Response: " +
            textParts[0]?.text,
        );
      }

      throw new Error("No image data found in Gemini API response");
    } catch (error) {
      console.error("Bedroom object removal error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        tokenUsage: undefined,
      };
    }
  }

  /**
   * Generate renovation image using assembly prompts for specific room elements
   * Allows targeting specific furniture/elements within a room
   * For bedrooms: performs two-pass (object removal first, then renovation)
   */
  async renovateImageWithAssembly(
    imageBase64: string,
    roomType: RenovationType,
    selectedElements?: string[],
    style: RenovationStyle = "default",
  ): Promise<GeminiRenovationResponse> {
    const totalTokenUsage = {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
    };

    // For bedrooms, do two-pass: first remove objects, then renovate
    if (roomType === "bedroom") {
      console.log("🛏️ BEDROOM DETECTED - Using two-pass renovation");
      
      // First pass: Remove all objects
      const removalResult = await this.removeBedroomObjects(imageBase64);
      if (!removalResult.success || !removalResult.renovatedImageBase64) {
        return {
          success: false,
          error: `Object removal failed: ${removalResult.error ?? "Unknown error"}`,
          tokenUsage: removalResult.tokenUsage,
        };
      }

      // Accumulate token usage from first pass
      if (removalResult.tokenUsage) {
        totalTokenUsage.promptTokenCount += removalResult.tokenUsage.promptTokenCount;
        totalTokenUsage.candidatesTokenCount += removalResult.tokenUsage.candidatesTokenCount;
        totalTokenUsage.totalTokenCount += removalResult.tokenUsage.totalTokenCount;
      }

      console.log("✅ First pass complete - Empty room generated, starting renovation...");
      console.log("📊 First pass token usage:", removalResult.tokenUsage);
      
      // Second pass: Apply renovation to empty room
      imageBase64 = removalResult.renovatedImageBase64;
    }
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

      // Call Gemini API with generation config for better structural preservation
      const model = this.genAI.models.generateContent({
        model: GEMINI_RENOVATION_SETTINGS.model,
        contents,
        config: {
          temperature: GEMINI_RENOVATION_SETTINGS.temperature,
          maxOutputTokens: GEMINI_RENOVATION_SETTINGS.maxOutputTokens,
        },
      });

      const response = await model;

      // Extract token usage from response
      const responseWithUsage = response as GeminiResponseWithUsage;
      const usageMetadata = responseWithUsage.usageMetadata;
      const tokenUsage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount ?? 0,
            candidatesTokenCount: usageMetadata.candidatesTokenCount ?? 0,
            totalTokenCount: usageMetadata.totalTokenCount ?? 0,
          }
        : null;

      if (tokenUsage) {
        console.log("📊 RENOVATION - Token Usage:", {
          promptTokens: tokenUsage.promptTokenCount,
          candidatesTokens: tokenUsage.candidatesTokenCount,
          totalTokens: tokenUsage.totalTokenCount,
        });
      }

      console.log("Gemini API assembly renovation response received:", {
        candidatesCount: response.candidates?.length ?? 0,
        hasContent: !!response.candidates?.[0]?.content,
        tokenUsage,
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
            tokenUsage,
          });

          // Accumulate token usage from renovation pass
          if (tokenUsage) {
            totalTokenUsage.promptTokenCount += tokenUsage.promptTokenCount;
            totalTokenUsage.candidatesTokenCount += tokenUsage.candidatesTokenCount;
            totalTokenUsage.totalTokenCount += tokenUsage.totalTokenCount;
          }

          // Log total token usage for all prompts involved
          console.log("📊 TOTAL TOKEN USAGE (All Prompts):", {
            totalPromptTokens: totalTokenUsage.promptTokenCount,
            totalCandidatesTokens: totalTokenUsage.candidatesTokenCount,
            totalTokens: totalTokenUsage.totalTokenCount,
            passes: roomType === "bedroom" ? 2 : 1,
            roomType,
          });

          return {
            success: true,
            renovatedImageBase64: imageData,
            tokenUsage: totalTokenUsage.totalTokenCount > 0 ? totalTokenUsage : undefined, // Return accumulated token usage
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
        tokenUsage: totalTokenUsage.totalTokenCount > 0 ? totalTokenUsage : undefined,
      };
    }
  }

  /**
   * Review and improve renovated image based on user feedback
   * Takes original image, renovated image, and user feedback text
   * Generates an improved version of the renovated image
   */
  async reviewRenovationImage(
    originalImageBase64: string,
    renovatedImageBase64: string,
    reviewText: string,
  ): Promise<RenovationReviewResponse> {
    try {
      console.log("Starting Gemini renovation review:", {
        model: GEMINI_RENOVATION_SETTINGS.model,
        temperature: GEMINI_RENOVATION_SETTINGS.temperature,
        maxOutputTokens: GEMINI_RENOVATION_SETTINGS.maxOutputTokens,
        reviewTextLength: reviewText.length,
        originalImageLength: originalImageBase64.length,
        renovatedImageLength: renovatedImageBase64.length,
      });

      // Clean base64 strings (remove data URL prefix if present)
      const cleanOriginalBase64 = originalImageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );
      const cleanRenovatedBase64 = renovatedImageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Create review prompt that instructs Gemini to apply user feedback
      const reviewPrompt = `You are an expert interior design AI. The user has provided feedback on a renovated room image. 

ORIGINAL IMAGE: The first image shows the original room before renovation.
RENOVATED IMAGE: The second image shows the room after renovation.

USER FEEDBACK: "${reviewText}"

TASK: Apply the user's feedback to improve the renovated image. Make the requested changes while maintaining:
- The same room structure, dimensions, and layout
- The same camera perspective and viewing angle
- Photorealistic quality and professional lighting
- Consistency with the renovation style

CRITICAL REQUIREMENTS:
- Preserve wall positions, floor boundaries, and architectural elements exactly
- Keep door and window openings at the same positions
- Maintain the same camera perspective
- Apply the user's feedback precisely
- Generate a high-quality, photorealistic image in 4K resolution

Return only the improved renovated image based on the user's feedback.`;

      // Prepare content array with both images and review prompt
      const contents = [
        { text: reviewPrompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanOriginalBase64,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanRenovatedBase64,
          },
        },
      ];

      // Call Gemini API with generation config
      const temperature = GEMINI_RENOVATION_SETTINGS.temperature;
      const maxOutputTokens = GEMINI_RENOVATION_SETTINGS.maxOutputTokens;

      console.log("🌡️ REVIEW API Call - Temperature:", temperature);

      const model = this.genAI.models.generateContent({
        model: GEMINI_RENOVATION_SETTINGS.model,
        contents,
        config: {
          temperature,
          maxOutputTokens,
        },
      });

      const response = await model;

      // Extract token usage from response
      const responseWithUsage = response as GeminiResponseWithUsage;
      const usageMetadata = responseWithUsage.usageMetadata;
      const tokenUsage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount ?? 0,
            candidatesTokenCount: usageMetadata.candidatesTokenCount ?? 0,
            totalTokenCount: usageMetadata.totalTokenCount ?? 0,
          }
        : null;

      if (tokenUsage) {
        console.log("📊 REVIEW - Token Usage:", {
          promptTokens: tokenUsage.promptTokenCount,
          candidatesTokens: tokenUsage.candidatesTokenCount,
          totalTokens: tokenUsage.totalTokenCount,
          temperature,
        });
      }

      console.log("Gemini API review response received:", {
        candidatesCount: response.candidates?.length ?? 0,
        hasContent: !!response.candidates?.[0]?.content,
        tokenUsage,
      });

      // Process response to find generated image
      if (!response.candidates?.[0]?.content?.parts) {
        throw new Error("No content returned from Gemini API");
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;

          console.log("Generated review image found:", {
            mimeType: part.inlineData.mimeType,
            dataLength: imageData?.length ?? 0,
            tokenUsage,
          });

          return {
            success: true,
            reviewedImageBase64: imageData,
            tokenUsage: tokenUsage ?? undefined,
          };
        }
      }

      // If no image data found, check for text response
      const textParts = response.candidates[0].content.parts.filter(
        (part) => part.text,
      );
      if (textParts.length > 0) {
        console.log("Gemini review text response:", textParts[0]?.text);
        throw new Error(
          "Gemini API returned text instead of image. Response: " +
            textParts[0]?.text,
        );
      }

      throw new Error("No image data found in Gemini API response");
    } catch (error) {
      console.error("Gemini renovation review error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Blur all faces in the image for privacy protection
   */
  async blurFaces(
    imageBase64: string,
  ): Promise<GeminiRenovationResponse> {
    try {
      console.log("🔒 BLUR FACES - Starting Gemini blur faces:", {
        model: GEMINI_RENOVATION_SETTINGS.model,
        imageDataLength: imageBase64.length,
      });

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Prepare content with blur faces prompt and image
      const contents = [
        { text: BLUR_FACES_PROMPT },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
      ];

      // Call Gemini API with moderate temperature for face blurring
      // Note: Only using temperature and maxOutputTokens as other params may not be supported for image generation
      const model = this.genAI.models.generateContent({
        model: GEMINI_RENOVATION_SETTINGS.model,
        contents,
        config: {
          temperature: 0.5, // Moderate temperature for balanced face blurring
          maxOutputTokens: GEMINI_RENOVATION_SETTINGS.maxOutputTokens,
        },
      });

      const response = await model;

      // Extract token usage from response
      const responseWithUsage = response as GeminiResponseWithUsage;
      const usageMetadata = responseWithUsage.usageMetadata;
      const tokenUsage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount ?? 0,
            candidatesTokenCount: usageMetadata.candidatesTokenCount ?? 0,
            totalTokenCount: usageMetadata.totalTokenCount ?? 0,
          }
        : null;

      if (tokenUsage) {
        console.log("📊 BLUR FACES - Token Usage:", {
          promptTokens: tokenUsage.promptTokenCount,
          candidatesTokens: tokenUsage.candidatesTokenCount,
          totalTokens: tokenUsage.totalTokenCount,
        });
      }

      // Check response structure
      const firstCandidate = response.candidates?.[0];
      
      console.log("🔍 BLUR FACES - Response structure:", {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length ?? 0,
        hasFirstCandidate: !!firstCandidate,
        hasContent: !!firstCandidate?.content,
        hasParts: !!firstCandidate?.content?.parts,
        partsLength: firstCandidate?.content?.parts?.length ?? 0,
        finishReason: firstCandidate?.finishReason,
        safetyRatings: firstCandidate?.safetyRatings,
      });

      // First, try to extract image content if it exists
      // Some finishReasons like IMAGE_OTHER might still have valid content
      if (firstCandidate?.content?.parts) {
        // Look for image data first
        for (const part of firstCandidate.content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            
            // If we found image data, check finishReason for warnings
            if (firstCandidate?.finishReason && String(firstCandidate.finishReason) !== "STOP") {
              console.warn("⚠️ BLUR FACES - Non-STOP finishReason but image found:", {
                finishReason: firstCandidate.finishReason,
                safetyRatings: firstCandidate.safetyRatings,
                imageDataLength: imageData?.length ?? 0,
              });
              
              // Check for safety blocks - if safetyRatings indicate blocking, don't use the image
              if (firstCandidate.safetyRatings) {
                const hasBlockingSafety = firstCandidate.safetyRatings.some(
                  (rating) => String(rating?.probability) === "HIGH" || String(rating?.probability) === "MEDIUM"
                );
                if (hasBlockingSafety) {
                  console.error("❌ BLUR FACES - Safety block detected despite content:", {
                    finishReason: firstCandidate.finishReason,
                    safetyRatings: firstCandidate.safetyRatings,
                  });
                  throw new Error(
                    `Gemini API blocked the request due to safety concerns. Finish reason: ${firstCandidate.finishReason}`,
                  );
                }
              }
            }
            
            console.log("✅ Blur faces successful:", {
              mimeType: part.inlineData.mimeType,
              dataLength: imageData?.length ?? 0,
              finishReason: firstCandidate?.finishReason,
              tokenUsage,
            });

            return {
              success: true,
              renovatedImageBase64: imageData,
              tokenUsage: tokenUsage ?? undefined,
            };
          }
        }
        
        // If no image found, check for text response
        const textParts = firstCandidate.content.parts.filter(
          (part) => part.text,
        );
        if (textParts.length > 0) {
          console.log("Gemini blur faces text response:", textParts[0]?.text);
          throw new Error(
            "Gemini API returned text instead of image. Response: " +
              textParts[0]?.text,
          );
        }
      }

      // If we reach here, there's no content or no useful content
      // Check finishReason and safetyRatings to determine the error
      if (firstCandidate?.finishReason && String(firstCandidate.finishReason) !== "STOP") {
        console.error("❌ BLUR FACES - Request blocked/filtered (no content):", {
          finishReason: firstCandidate.finishReason,
          safetyRatings: firstCandidate.safetyRatings,
        });
        
        // Provide more specific error message based on finishReason
        if (String(firstCandidate.finishReason) === "IMAGE_OTHER") {
          throw new Error(
            "Gemini API could not process the image. The image may be unsupported, corrupted, or too complex for face blurring.",
          );
        }
        
        throw new Error(
          `Gemini API blocked the request. Finish reason: ${firstCandidate.finishReason}`,
        );
      }

      // No content and no specific finishReason - generic error
      console.error("❌ BLUR FACES - No content in response:", {
        finishReason: firstCandidate?.finishReason,
        safetyRatings: firstCandidate?.safetyRatings,
        candidates: response.candidates,
        firstCandidate: firstCandidate,
      });
      throw new Error(
        `No content returned from Gemini API. Finish reason: ${firstCandidate?.finishReason ?? "unknown"}`,
      );
    } catch (error) {
      console.error("Blur faces error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        tokenUsage: undefined,
      };
    }
  }

  /**
   * Remove all clutter and non-furniture items from the image
   */
  async removeClutter(
    imageBase64: string,
  ): Promise<GeminiRenovationResponse> {
    try {
      console.log("🧹 REMOVE CLUTTER - Starting Gemini remove clutter:", {
        model: GEMINI_RENOVATION_SETTINGS.model,
        imageDataLength: imageBase64.length,
      });

      // Clean base64 string
      const cleanBase64 = imageBase64.replace(
        /^data:image\/[a-zA-Z]+;base64,/,
        "",
      );

      // Prepare content with remove clutter prompt and image
      const contents = [
        { text: REMOVE_CLUTTER_PROMPT },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
      ];

      // Call Gemini API with moderate temperature for clutter removal
      // Note: Only using temperature and maxOutputTokens as other params may not be supported for image generation
      const model = this.genAI.models.generateContent({
        model: GEMINI_RENOVATION_SETTINGS.model,
        contents,
        config: {
          temperature: 0.5, // Moderate temperature for balanced clutter removal
          maxOutputTokens: GEMINI_RENOVATION_SETTINGS.maxOutputTokens,
        },
      });

      const response = await model;

      // Extract token usage from response
      const responseWithUsage = response as GeminiResponseWithUsage;
      const usageMetadata = responseWithUsage.usageMetadata;
      const tokenUsage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount ?? 0,
            candidatesTokenCount: usageMetadata.candidatesTokenCount ?? 0,
            totalTokenCount: usageMetadata.totalTokenCount ?? 0,
          }
        : null;

      if (tokenUsage) {
        console.log("📊 REMOVE CLUTTER - Token Usage:", {
          promptTokens: tokenUsage.promptTokenCount,
          candidatesTokens: tokenUsage.candidatesTokenCount,
          totalTokens: tokenUsage.totalTokenCount,
        });
      }

      // Check response structure
      const firstCandidate = response.candidates?.[0];
      
      console.log("🔍 REMOVE CLUTTER - Response structure:", {
        hasCandidates: !!response.candidates,
        candidatesLength: response.candidates?.length ?? 0,
        hasFirstCandidate: !!firstCandidate,
        hasContent: !!firstCandidate?.content,
        hasParts: !!firstCandidate?.content?.parts,
        partsLength: firstCandidate?.content?.parts?.length ?? 0,
        finishReason: firstCandidate?.finishReason,
        safetyRatings: firstCandidate?.safetyRatings,
      });

      // First, try to extract image content if it exists
      // Some finishReasons like IMAGE_OTHER might still have valid content
      if (firstCandidate?.content?.parts) {
        // Look for image data first
        for (const part of firstCandidate.content.parts) {
          if (part.inlineData) {
            const imageData = part.inlineData.data;
            
            // If we found image data, check finishReason for warnings
            if (firstCandidate?.finishReason && String(firstCandidate.finishReason) !== "STOP") {
              console.warn("⚠️ REMOVE CLUTTER - Non-STOP finishReason but image found:", {
                finishReason: firstCandidate.finishReason,
                safetyRatings: firstCandidate.safetyRatings,
                imageDataLength: imageData?.length ?? 0,
              });
              
              // Check for safety blocks - if safetyRatings indicate blocking, don't use the image
              if (firstCandidate.safetyRatings) {
                const hasBlockingSafety = firstCandidate.safetyRatings.some(
                  (rating) => String(rating?.probability) === "HIGH" || String(rating?.probability) === "MEDIUM"
                );
                if (hasBlockingSafety) {
                  console.error("❌ REMOVE CLUTTER - Safety block detected despite content:", {
                    finishReason: firstCandidate.finishReason,
                    safetyRatings: firstCandidate.safetyRatings,
                  });
                  throw new Error(
                    `Gemini API blocked the request due to safety concerns. Finish reason: ${firstCandidate.finishReason}`,
                  );
                }
              }
            }
            
            console.log("✅ Remove clutter successful:", {
              mimeType: part.inlineData.mimeType,
              dataLength: imageData?.length ?? 0,
              finishReason: firstCandidate?.finishReason,
              tokenUsage,
            });

            return {
              success: true,
              renovatedImageBase64: imageData,
              tokenUsage: tokenUsage ?? undefined,
            };
          }
        }
        
        // If no image found, check for text response
        const textParts = firstCandidate.content.parts.filter(
          (part) => part.text,
        );
        if (textParts.length > 0) {
          console.log("Gemini remove clutter text response:", textParts[0]?.text);
          throw new Error(
            "Gemini API returned text instead of image. Response: " +
              textParts[0]?.text,
          );
        }
      }

      // If we reach here, there's no content or no useful content
      // Check finishReason and safetyRatings to determine the error
      if (firstCandidate?.finishReason && String(firstCandidate.finishReason) !== "STOP") {
        console.error("❌ REMOVE CLUTTER - Request blocked/filtered (no content):", {
          finishReason: firstCandidate.finishReason,
          safetyRatings: firstCandidate.safetyRatings,
        });
        
        // Provide more specific error message based on finishReason
        if (String(firstCandidate.finishReason) === "IMAGE_OTHER") {
          throw new Error(
            "Gemini API could not process the image. The image may be unsupported, corrupted, or too complex for clutter removal.",
          );
        }
        
        throw new Error(
          `Gemini API blocked the request. Finish reason: ${firstCandidate.finishReason}`,
        );
      }

      // No content and no specific finishReason - generic error
      console.error("❌ REMOVE CLUTTER - No content in response:", {
        finishReason: firstCandidate?.finishReason,
        safetyRatings: firstCandidate?.safetyRatings,
        candidates: response.candidates,
        firstCandidate: firstCandidate,
      });
      throw new Error(
        `No content returned from Gemini API. Finish reason: ${firstCandidate?.finishReason ?? "unknown"}`,
      );
    } catch (error) {
      console.error("Remove clutter error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: errorMessage,
        tokenUsage: undefined,
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

  reviewRenovationImage: (
    originalImageBase64: string,
    renovatedImageBase64: string,
    reviewText: string,
  ) =>
    geminiClient.instance.reviewRenovationImage(
      originalImageBase64,
      renovatedImageBase64,
      reviewText,
    ),

  validateImageInput: (imageBase64: string) =>
    geminiClient.instance.validateImageInput(imageBase64),

  blurFaces: (imageBase64: string) =>
    geminiClient.instance.blurFaces(imageBase64),

  removeClutter: (imageBase64: string) =>
    geminiClient.instance.removeClutter(imageBase64),
};

// Also export the class for testing purposes
export { GeminiClient };
