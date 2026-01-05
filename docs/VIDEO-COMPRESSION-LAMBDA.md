# Video Compression with AWS Lambda

This document describes how to implement server-side video compression using AWS Lambda triggered by S3 uploads.

## Overview

```
┌──────────┐     ┌────────┐     ┌────────────┐     ┌────────┐
│  Client  │────▶│   S3   │────▶│   Lambda   │────▶│   S3   │
│  Upload  │     │ (raw)  │     │  (FFmpeg)  │     │(compressed)
└──────────┘     └────────┘     └────────────┘     └────────┘
                      │                                  │
                      └──────────── App uses ────────────┘
```

## Why Lambda?

- **No timeout issues** - Lambda has 15 min limit (enough for most videos)
- **Scales automatically** - handles concurrent uploads
- **Cost effective** - ~$0.01 per video
- **Set and forget** - once configured, works automatically

## Implementation Steps

### 1. Create the Lambda Function

Create a new Lambda function with Node.js 18.x runtime.

**Function code (`index.mjs`):**

```javascript
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { createWriteStream, createReadStream, unlinkSync, mkdirSync } from "fs";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Compression settings
const TARGET_WIDTH = 720;
const CRF = 28; // Quality (lower = better, 23 is default)
const PRESET = "fast";
const AUDIO_BITRATE = "128k";

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  // Skip if already compressed or not a video
  if (key.includes("/compressed/") || key.includes("-compressed.")) {
    console.log("Skipping already compressed file:", key);
    return { statusCode: 200, body: "Skipped" };
  }

  const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v"];
  const ext = key.toLowerCase().substring(key.lastIndexOf("."));
  if (!videoExtensions.includes(ext)) {
    console.log("Skipping non-video file:", key);
    return { statusCode: 200, body: "Skipped" };
  }

  const workDir = join(tmpdir(), randomUUID());
  mkdirSync(workDir, { recursive: true });

  const inputPath = join(workDir, `input${ext}`);
  const outputPath = join(workDir, "output.mp4");

  try {
    // Download from S3
    console.log("Downloading:", key);
    const getCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3Client.send(getCommand);
    await pipeline(response.Body, createWriteStream(inputPath));
    console.log("Download complete");

    // Compress with FFmpeg
    console.log("Starting compression...");
    await compressVideo(inputPath, outputPath);
    console.log("Compression complete");

    // Upload compressed version
    const compressedKey = key.replace(/\.[^.]+$/, "-compressed.mp4");
    console.log("Uploading to:", compressedKey);

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: compressedKey,
      Body: createReadStream(outputPath),
      ContentType: "video/mp4",
    });
    await s3Client.send(putCommand);
    console.log("Upload complete");

    // Cleanup
    try {
      unlinkSync(inputPath);
      unlinkSync(outputPath);
    } catch (cleanupError) {
      console.warn("Cleanup warning:", cleanupError);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        original: key,
        compressed: compressedKey,
      }),
    };
  } catch (error) {
    // Log the error but don't throw - skip this video gracefully
    console.error("Compression failed, skipping video:", key);
    console.error("Error details:", error);

    // Cleanup any temp files that may exist
    try {
      unlinkSync(inputPath);
    } catch (e) { /* ignore */ }
    try {
      unlinkSync(outputPath);
    } catch (e) { /* ignore */ }

    // Return success so Lambda doesn't retry - the original video is still usable
    return {
      statusCode: 200,
      body: JSON.stringify({
        skipped: true,
        reason: "compression_failed",
        original: key,
        error: error.message,
      }),
    };
  }
};

function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      "-i", inputPath,
      "-vf", `scale='min(${TARGET_WIDTH},iw)':-2`,
      "-c:v", "libx264",
      "-crf", String(CRF),
      "-preset", PRESET,
      "-c:a", "aac",
      "-b:a", AUDIO_BITRATE,
      "-movflags", "+faststart",
      "-y",
      outputPath,
    ];

    const ffmpeg = spawn("/opt/bin/ffmpeg", args);

    ffmpeg.stdout.on("data", (data) => console.log("FFmpeg:", data.toString()));
    ffmpeg.stderr.on("data", (data) => console.log("FFmpeg:", data.toString()));

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", reject);
  });
}
```

### 2. Add FFmpeg Lambda Layer

FFmpeg doesn't come with Lambda. Use a pre-built layer:

**Option A: Public Layer (easiest)**

Use this ARN (check for latest version):
```
arn:aws:lambda:us-east-1:123456789:layer:ffmpeg:1
```

Search for "ffmpeg lambda layer" in AWS Serverless Application Repository.

**Option B: Build your own**

```bash
# On Amazon Linux 2 or similar
mkdir -p layer/bin
cd layer

# Download static FFmpeg build
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz | tar xJ
cp ffmpeg-*-static/ffmpeg bin/
cp ffmpeg-*-static/ffprobe bin/

# Create layer zip
zip -r ffmpeg-layer.zip bin/

# Upload to AWS
aws lambda publish-layer-version \
  --layer-name ffmpeg \
  --zip-file fileb://ffmpeg-layer.zip \
  --compatible-runtimes nodejs18.x nodejs20.x
```

### 3. Configure Lambda Settings

| Setting | Value |
|---------|-------|
| Memory | 1024 MB (minimum for FFmpeg) |
| Timeout | 10 minutes (600 seconds) |
| Ephemeral storage | 1024 MB (for temp files) |

### 4. Set Up IAM Permissions

The Lambda execution role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/memoria/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "*"
    }
  ]
}
```

### 5. Configure S3 Trigger

1. Go to your S3 bucket
2. Properties → Event notifications → Create event notification
3. Configure:
   - **Name:** `video-compression-trigger`
   - **Prefix:** `memoria/` (adjust to your path)
   - **Suffix:** `.mp4`, `.mov`, `.MOV` (create separate for each)
   - **Event types:** `s3:ObjectCreated:*`
   - **Destination:** Lambda function → select your function

### 6. Update Your App

Modify the video URL logic to prefer compressed versions:

```typescript
// In your video component or API
function getVideoUrl(originalUrl: string): string {
  // Check if compressed version exists
  const compressedUrl = originalUrl.replace(/\.[^.]+$/, "-compressed.mp4");

  // You could check if it exists, or just try compressed first
  return compressedUrl;
}
```

Or update the database after compression:

```typescript
// Lambda can call your API to update the record
const response = await fetch("https://your-app.com/api/update-video-url", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.API_SECRET}`,
  },
  body: JSON.stringify({
    originalKey: key,
    compressedKey: compressedKey,
  }),
});
```

## Alternative: Using AWS MediaConvert

For more complex needs (multiple resolutions, HLS streaming), use AWS MediaConvert:

```javascript
import { MediaConvertClient, CreateJobCommand } from "@aws-sdk/client-mediaconvert";

const client = new MediaConvertClient({
  region: "us-east-1",
  endpoint: "https://xxxxx.mediaconvert.us-east-1.amazonaws.com"
});

const command = new CreateJobCommand({
  Role: "arn:aws:iam::ACCOUNT:role/MediaConvertRole",
  Settings: {
    Inputs: [{
      FileInput: `s3://${bucket}/${key}`,
    }],
    OutputGroups: [{
      Name: "File Group",
      OutputGroupSettings: {
        Type: "FILE_GROUP_SETTINGS",
        FileGroupSettings: {
          Destination: `s3://${bucket}/compressed/`,
        },
      },
      Outputs: [{
        VideoDescription: {
          Width: 720,
          Height: 480,
          CodecSettings: {
            Codec: "H_264",
            H264Settings: {
              RateControlMode: "QVBR",
              QvbrSettings: { QvbrQualityLevel: 7 },
            },
          },
        },
        AudioDescriptions: [{
          CodecSettings: {
            Codec: "AAC",
            AacSettings: { Bitrate: 128000 },
          },
        }],
        ContainerSettings: {
          Container: "MP4",
        },
      }],
    }],
  },
});

await client.send(command);
```

## Cost Estimation

| Videos/month | Lambda Cost | S3 Storage (compressed) |
|--------------|-------------|-------------------------|
| 100 | ~$1 | ~$0.50 |
| 1,000 | ~$10 | ~$5 |
| 10,000 | ~$100 | ~$50 |

*Assumes average 50MB video, 1 minute processing time, 720p output*

## Troubleshooting

### Lambda times out
- Increase timeout (max 15 minutes)
- Increase memory (more memory = faster CPU)
- Check video size (very large videos may need different approach)

### FFmpeg not found
- Verify layer is attached to function
- Check layer ARN and region
- Verify `/opt/bin/ffmpeg` path

### S3 permission errors
- Check IAM role permissions
- Verify bucket policy allows Lambda access
- Check resource ARN in policy matches bucket

### Compression quality issues
- Lower CRF value (e.g., 23 instead of 28) for better quality
- Use `slower` preset for better compression
- Increase target resolution if needed

## Current Status

**Status: APP-SIDE READY**

The application is now ready to receive compressed videos from Lambda:

### Implemented:
- ✅ Database schema updated with `compressed_url`, `compressed_s3_key`, `compressed_file_size` columns
- ✅ TypeScript types updated for `VideoMemory`
- ✅ FeedItem component prefers compressed URLs when available
- ✅ API endpoint `/api/video-compression-callback` for Lambda to update records
- ✅ Utility functions in `src/lib/s3.ts` for URL transformations

### Required Environment Variable:
```bash
API_VIDEO_COMPRESSION_SECRET=your-secret-key-here
```

### Database Migration:
```sql
ALTER TABLE memories
  ADD COLUMN compressed_url VARCHAR(2048),
  ADD COLUMN compressed_s3_key VARCHAR(2048),
  ADD COLUMN compressed_file_size INTEGER;
```

### Pending:
- ⬜ Deploy Lambda function with FFmpeg layer
- ⬜ Configure S3 trigger for `memoria/` prefix
- ⬜ Set up IAM permissions for Lambda

Client-side compression was attempted but failed due to:
- FFmpeg WASM CORS issues
- Nested worker security restrictions
- Turbopack module resolution issues
