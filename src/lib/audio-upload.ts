import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import { getDynamicBucketName } from "~/lib/s3-bucket";

// Validate required environment variables
const requiredEnvVars = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};

// Check if any required environment variables are missing
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required AWS environment variables: ${missingEnvVars.join(", ")}`,
  );
}

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Get the appropriate file extension for an audio MIME type
 */
function getAudioExtension(mimeType: string): string {
  const baseMimeType = mimeType.split(";")[0]?.trim() ?? "";

  const extensionMap: Record<string, string> = {
    "audio/webm": "webm",
    "audio/wav": "wav",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/mp4": "mp4",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
    "audio/x-m4a": "m4a",
  };

  return extensionMap[baseMimeType] ?? "webm";
}

export async function uploadAudioToS3(
  audioBlob: Blob,
  referenceNumber: string,
): Promise<{
  audioUrl: string;
  s3key: string;
  audioKey: string;
}> {
  try {
    if (!audioBlob) {
      throw new Error("No audio blob provided");
    }

    if (!referenceNumber) {
      throw new Error("No reference number provided");
    }

    // Get dynamic bucket name based on current user's account
    const bucketName = await getDynamicBucketName();

    // Get the appropriate file extension based on MIME type
    const extension = getAudioExtension(audioBlob.type);
    const contentType = audioBlob.type.split(";")[0]?.trim() ?? "audio/webm";

    // Generate a unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const audioKey = `${referenceNumber}/audio/voice_recording_${timestamp}_${nanoid(6)}.${extension}`;
    const s3key = `s3://${bucketName}/${audioKey}`;

    // Convert Blob to Buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: audioKey,
        Body: buffer,
        ContentType: contentType,
        // Add metadata for better organization
        Metadata: {
          source: "voice-recording",
          referenceNumber: referenceNumber,
          uploadTimestamp: new Date().toISOString(),
          originalMimeType: audioBlob.type,
        },
      }),
    );

    // Return the audio URL and keys
    const audioUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${audioKey}`;

    console.log(`✅ [AUDIO-UPLOAD] Successfully uploaded audio: ${audioKey}`);

    return {
      audioUrl,
      s3key,
      audioKey,
    };
  } catch (error) {
    console.error("❌ [AUDIO-UPLOAD] Error uploading audio to S3:", error);
    throw error;
  }
}

/**
 * Helper function to validate audio file before upload
 */
export function validateAudioBlob(audioBlob: Blob): {
  isValid: boolean;
  error?: string;
} {
  // Check if blob exists
  if (!audioBlob) {
    return { isValid: false, error: "No audio file provided" };
  }

  // Check file size (max 50MB for 5-minute recordings)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (audioBlob.size > maxSize) {
    return {
      isValid: false,
      error: `Audio file too large: ${Math.round(audioBlob.size / 1024 / 1024)}MB (max 50MB)`,
    };
  }

  // Check minimum size (should have some content)
  const minSize = 1024; // 1KB
  if (audioBlob.size < minSize) {
    return {
      isValid: false,
      error: "Audio file too small - recording may be empty",
    };
  }

  // Check MIME type - support base types and variants with codecs
  const validBaseTypes = [
    "audio/webm",
    "audio/wav",
    "audio/mp3",
    "audio/ogg",
    "audio/mp4",
    "audio/m4a",
    "audio/aac",
    "audio/mpeg",
    "audio/x-m4a",
  ];

  // Extract base MIME type (without codec info like ";codecs=opus")
  const baseMimeType = audioBlob.type.split(";")[0]?.trim() ?? "";

  if (!validBaseTypes.includes(baseMimeType)) {
    return {
      isValid: false,
      error: `Invalid audio format: ${audioBlob.type}. Supported: ${validBaseTypes.join(", ")}`,
    };
  }

  return { isValid: true };
}

/**
 * Get audio file information for logging/debugging
 */
export function getAudioInfo(audioBlob: Blob): {
  size: string;
  type: string;
  duration?: string;
} {
  const sizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);

  return {
    size: `${sizeMB}MB`,
    type: audioBlob.type,
  };
}
