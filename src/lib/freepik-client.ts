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
  private baseUrl = "https://api.freepik.com/v1/ai/image-upscaler-precision";

  constructor() {
    validateEnvironment();
    this.apiKey = process.env.FREEPIK_API_KEY!;
  }

  /**
   * Enhance an image using Freepik's Image Upscaler Precision API
   * Always uses Light preset settings for cost optimization
   */
  async enhance(imageBase64: string): Promise<FreepikEnhanceResponse> {
    const requestBody = {
      image: imageBase64,
      sharpen: LIGHT_ENHANCEMENT_SETTINGS.sharpen,
      smart_grain: LIGHT_ENHANCEMENT_SETTINGS.smartGrain,
      ultra_detail: LIGHT_ENHANCEMENT_SETTINGS.ultraDetail,
    };

    console.log("Freepik API request details:", {
      url: this.baseUrl,
      headers: {
        "x-freepik-api-key": this.apiKey
          ? `${this.apiKey.substring(0, 8)}...`
          : "MISSING",
        "Content-Type": "application/json",
      },
      bodySize: JSON.stringify(requestBody).length,
      imageDataLength: imageBase64.length,
      imageDataPrefix: imageBase64.substring(0, 50) + "...",
      settings: {
        sharpen: LIGHT_ENHANCEMENT_SETTINGS.sharpen,
        smart_grain: LIGHT_ENHANCEMENT_SETTINGS.smartGrain,
        ultra_detail: LIGHT_ENHANCEMENT_SETTINGS.ultraDetail,
      },
    });

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
        status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
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
        status: "CREATED" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
        progress?: number;
        generated?: string[]; // Freepik returns images directly here
        error?: string;
        [key: string]: unknown; // Allow other fields
      };
    };

    // Fix: Freepik returns generated images directly in data.generated, not data.result.generated
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

          // Try to get error message from response
          let errorMessage = `API error: ${response.status}`;
          try {
            const errorData = (await response.json()) as {
              error?: string;
              message?: string;
              details?: string;
            };
            console.error("Freepik API error details:", {
              status: response.status,
              statusText: response.statusText,
              errorData,
            });

            if (errorData.error) {
              errorMessage = `API error: ${response.status} - ${errorData.error}`;
            } else if (errorData.message) {
              errorMessage = `API error: ${response.status} - ${errorData.message}`;
            } else if (errorData.details) {
              errorMessage = `API error: ${response.status} - ${errorData.details}`;
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
  enhance: (imageBase64: string) => freepikClient.instance.enhance(imageBase64),
  checkStatus: (taskId: string) => freepikClient.instance.checkStatus(taskId),
};

// Also export the class for testing purposes
export { FreepikClient };
