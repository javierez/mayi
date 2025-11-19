import sharp from "sharp";
import {
  LIGHT_ENHANCEMENT_SETTINGS,
  type FreepikEnhanceResponse,
  type FreepikTaskStatus,
} from "~/types/freepik";

// Environment validation function (called at runtime, not module load)
function validateEnvironment() {
  const requiredEnvVars = {
    FREEPIK_API_KEY: process.env.FREEPIK_API_KEY,
  };

  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required Freepik environment variables: ${missingEnvVars.join(", ")}`,
    );
  }
}

class FreepikClient {
  private apiKey: string;
  private baseUrl = "https://api.freepik.com/v1/ai/image-upscaler-precision"; // v1 (not v2)

  constructor() {
    validateEnvironment();
    this.apiKey = process.env.FREEPIK_API_KEY!;
  }

  /**
   * Enhance an image using Freepik's Image Upscaler Precision API v1
   * Converts image URL to base64 and uses minimal settings for cost optimization
   * Automatically converts unsupported formats (AVIF, WebP, etc.) to JPEG
   */
  async enhance(imageUrl: string): Promise<FreepikEnhanceResponse> {
    // Download and convert image to base64 (v1 requires base64)
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    // Get content type and validate it's a supported format
    const contentType = imageResponse.headers.get("content-type") || "";
    const supportedFormats = ["image/jpeg", "image/jpg", "image/png"];
    const isSupportedFormat = supportedFormats.some((format) =>
      contentType.toLowerCase().includes(format),
    );

    let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    // Validate image buffer is not empty
    if (imageBuffer.length === 0) {
      throw new Error("Downloaded image is empty");
    }

    // Validate image size (Freepik has limits, typically 10MB)
    const originalSizeMB = imageBuffer.length / (1024 * 1024);
    if (originalSizeMB > 10) {
      throw new Error(
        `Image too large (${originalSizeMB.toFixed(2)}MB). Maximum size is 10MB`,
      );
    }

    // Convert unsupported formats to JPEG using sharp
    if (!isSupportedFormat && contentType) {
      console.log(
        `Converting unsupported format ${contentType} to JPEG for Freepik API...`,
      );
      try {
        // Use sharp to convert to JPEG (high quality to preserve image quality)
        const convertedBuffer = await sharp(imageBuffer)
          .jpeg({ quality: 95 })
          .toBuffer();
        imageBuffer = Buffer.from(convertedBuffer);
        console.log(
          `✅ Converted to JPEG. New size: ${(imageBuffer.length / (1024 * 1024)).toFixed(2)}MB`,
        );
      } catch (conversionError) {
        console.error("Failed to convert image format:", conversionError);
        throw new Error(
          `Unsupported image format: ${contentType}. Freepik requires JPEG or PNG. Image conversion failed.`,
        );
      }
    }

    const base64Image = imageBuffer.toString("base64");

    // Validate base64 encoding
    if (!base64Image || base64Image.length === 0) {
      throw new Error("Failed to encode image to base64");
    }

    const finalSizeMB = imageBuffer.length / (1024 * 1024);
    console.log("Freepik API request:", {
      originalFormat: contentType,
      finalFormat: isSupportedFormat ? contentType : "image/jpeg (converted)",
      imageSizeMB: finalSizeMB.toFixed(2),
      base64Length: base64Image.length,
      wasConverted: !isSupportedFormat && contentType,
    });

    const requestBody = {
      image: base64Image, // v1 requires base64, not URL
      sharpen: LIGHT_ENHANCEMENT_SETTINGS.sharpen,
      smart_grain: LIGHT_ENHANCEMENT_SETTINGS.smartGrain,
      ultra_detail: LIGHT_ENHANCEMENT_SETTINGS.ultraDetail,
    };

    const response = (await this.fetchWithRetry("", {
      method: "POST",
      headers: {
        "x-freepik-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })) as {
      data: {
        task_id: string;
        status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
        generated?: string[];
        error?: string;
      };
    };

    return {
      taskId: response.data.task_id,
      status: response.data.status,
      generated: response.data.generated,
      error: response.data.error,
    };
  }

  /**
   * Check the status of an enhancement task
   */
  async checkStatus(taskId: string): Promise<FreepikTaskStatus> {
    const response = (await this.fetchWithRetry(`/${taskId}`, {
      method: "GET",
      headers: {
        "x-freepik-api-key": this.apiKey,
      },
    })) as {
      data: {
        status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
        progress?: number;
        generated?: string[]; // Freepik returns images directly here
        error?: string;
        [key: string]: unknown; // Allow other fields
      };
    };

    // Freepik returns generated images directly in data.generated, not data.result.generated
    const result =
      response.data.generated && response.data.generated.length > 0
        ? {
            generated: response.data.generated,
          }
        : undefined;

    return {
      id: taskId,
      status: response.data.status,
      progress: response.data.progress,
      result: result,
      error: response.data.error,
    };
  }

  /**
   * Fetch with exponential backoff retry logic
   */
  private async fetchWithRetry(
    endpoint: string,
    options: RequestInit,
    retries = 3,
  ): Promise<unknown> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, options);

        if (!response.ok) {
          if (response.status === 429) {
            // Rate limited - wait and retry
            const waitTime = Math.pow(2, i) * 1000;
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }

          // Don't retry on client errors (4xx) - they won't succeed
          if (response.status >= 400 && response.status < 500) {
            // Try to get error message from response
            let errorMessage = `API error: ${response.status}`;
            try {
              const errorData = (await response.json()) as {
                error?: string;
                message?: string;
                details?: string;
                invalid_params?: Array<{
                  field?: string;
                  name?: string;
                  reason?: string;
                }>;
              };
              console.error("Freepik API error details:", {
                status: response.status,
                statusText: response.statusText,
                errorData,
                fullError: JSON.stringify(errorData, null, 2),
              });

              // Check for image validation errors
              if (errorData.invalid_params) {
                const imageParamError = errorData.invalid_params.find(
                  (param) =>
                    (param.field === "body.image" ||
                      param.name === "image" ||
                      param.reason?.toLowerCase().includes("image") ||
                      param.reason?.toLowerCase().includes("base64")) &&
                    param.reason,
                );
                if (imageParamError) {
                  errorMessage = `Image validation failed: ${imageParamError.reason}. Please ensure the image is a valid JPEG or PNG format.`;
                }
              }

              if (!errorMessage.includes("Image validation failed")) {
                if (errorData.error) {
                  errorMessage = `API error: ${response.status} - ${errorData.error}`;
                } else if (errorData.message) {
                  errorMessage = `API error: ${response.status} - ${errorData.message}`;
                } else if (errorData.details) {
                  errorMessage = `API error: ${response.status} - ${errorData.details}`;
                }
              }
            } catch (parseError) {
              console.error(
                "Failed to parse Freepik error response:",
                parseError,
              );
              // If we can't parse the error response, use the status code
            }

            throw new Error(errorMessage);
          }

          // For server errors (5xx), try to get error message but allow retry
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = (await response.json()) as {
              error?: string;
              message?: string;
              details?: string;
            };
            if (errorData.error) {
              errorMessage = `API error: ${response.status} - ${errorData.error}`;
            } else if (errorData.message) {
              errorMessage = `API error: ${response.status} - ${errorData.message}`;
            } else if (errorData.details) {
              errorMessage = `API error: ${response.status} - ${errorData.details}`;
            }
          } catch (parseError) {
            // If we can't parse, continue with retry
          }

          throw new Error(errorMessage);
        }

        return await response.json();
      } catch (error) {
        if (i === retries - 1) {
          // Last retry failed, throw the error
          console.error("Freepik API error after all retries:", error);
          throw error;
        }

        // Wait before retrying with exponential backoff
        const waitTime = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }

    // This shouldn't be reached, but TypeScript requires it
    throw new Error("Max retries exceeded");
  }
}

// Export a lazy-loaded singleton instance
let clientInstance: FreepikClient | null = null;

export const freepikClient = {
  get instance(): FreepikClient {
    clientInstance ??= new FreepikClient();
    return clientInstance;
  },

  // Proxy methods to the actual client
  enhance: (imageUrl: string) => freepikClient.instance.enhance(imageUrl),
  checkStatus: (taskId: string) => freepikClient.instance.checkStatus(taskId),
};

// Also export the class for testing purposes
export { FreepikClient };
