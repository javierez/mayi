import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./s3";

const BUCKET_NAME = "vesta-configuration-files";
const EXAMPLES_KEY = "examples/text.txt";

// Cache for examples to avoid repeated S3 calls
let cachedExamples: string | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetches the property description examples from S3
 * Uses caching to avoid repeated S3 calls
 */
export async function fetchPropertyExamplesFromS3(): Promise<string> {
  const now = Date.now();

  // Return cached version if it's still fresh
  if (cachedExamples && now - lastFetchTime < CACHE_DURATION) {
    return cachedExamples;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: EXAMPLES_KEY,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("Empty response from S3");
    }

    // Convert stream to string
    const examplesText = await response.Body.transformToString();

    // Cache the result
    cachedExamples = examplesText;
    lastFetchTime = now;

    console.log(
      `Fetched ${examplesText.length} characters of examples from S3`,
    );

    return examplesText;
  } catch (error) {
    console.error("Error fetching examples from S3:", error);

    // Return empty string if S3 fetch fails - GPT-4 will still work without examples
    return "";
  }
}

/**
 * Clears the cached examples (useful for testing or manual refresh)
 */
export function clearExamplesCache(): void {
  cachedExamples = null;
  lastFetchTime = 0;
}
