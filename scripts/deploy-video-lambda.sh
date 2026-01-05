#!/bin/bash
set -e

# Configuration
BUCKET_NAME="mayi"
REGION="us-east-1"
FUNCTION_NAME="mayi-video-compressor"
ROLE_NAME="mayi-video-compressor-role"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Video compression settings (480p for fast loading)
TARGET_WIDTH=480
CRF=28
PRESET="fast"

echo "🎬 Deploying video compression Lambda..."
echo "   Bucket: $BUCKET_NAME"
echo "   Region: $REGION"
echo "   Target resolution: ${TARGET_WIDTH}p"

# Create temp directory
WORK_DIR=$(mktemp -d)
echo "📁 Working in: $WORK_DIR"

# Step 1: Create IAM role
echo ""
echo "1️⃣  Creating IAM role..."

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

# Check if role exists
if aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
  echo "   Role already exists, skipping..."
else
  aws iam create-role \
    --role-name $ROLE_NAME \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Role for video compression Lambda"
  echo "   Role created"
fi

# Attach policies
POLICY_DOC='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:PutObject"],
      "Resource": "arn:aws:s3:::'"$BUCKET_NAME"'/*"
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
}'

aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name "${FUNCTION_NAME}-policy" \
  --policy-document "$POLICY_DOC"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "   Role ARN: $ROLE_ARN"

# Wait for role to propagate
echo "   Waiting for role to propagate..."
sleep 10

# Step 2: Create Lambda function code
echo ""
echo "2️⃣  Creating Lambda function code..."

cat > "$WORK_DIR/index.mjs" << 'LAMBDA_CODE'
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { spawn } from "child_process";
import { createWriteStream, createReadStream, unlinkSync, mkdirSync, statSync } from "fs";
import { pipeline } from "stream/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Compression settings - 480p for fast mobile loading
const TARGET_WIDTH = parseInt(process.env.TARGET_WIDTH || "480");
const CRF = parseInt(process.env.CRF || "28");
const PRESET = process.env.PRESET || "fast";
const AUDIO_BITRATE = "96k";

export const handler = async (event) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  // Skip if already compressed or not in memoria folder
  if (key.includes("-compressed.") || !key.includes("memoria/")) {
    console.log("Skipping:", key);
    return { statusCode: 200, body: "Skipped" };
  }

  const videoExtensions = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".m4v", ".MOV", ".MP4"];
  const ext = key.substring(key.lastIndexOf("."));
  if (!videoExtensions.some(e => key.toLowerCase().endsWith(e.toLowerCase()))) {
    console.log("Not a video:", key);
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

    const originalSize = statSync(inputPath).size;
    console.log("Original size:", (originalSize / 1024 / 1024).toFixed(2), "MB");

    // Compress with FFmpeg
    console.log("Compressing to", TARGET_WIDTH + "p...");
    await compressVideo(inputPath, outputPath);

    const compressedSize = statSync(outputPath).size;
    console.log("Compressed size:", (compressedSize / 1024 / 1024).toFixed(2), "MB");
    console.log("Reduction:", Math.round((1 - compressedSize/originalSize) * 100) + "%");

    // Upload compressed version
    const compressedKey = key.replace(/\.[^.]+$/, "-compressed.mp4");
    console.log("Uploading:", compressedKey);

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: compressedKey,
      Body: createReadStream(outputPath),
      ContentType: "video/mp4",
    });
    await s3Client.send(putCommand);

    // Call callback to update database
    if (process.env.CALLBACK_URL && process.env.CALLBACK_SECRET) {
      try {
        const callbackResponse = await fetch(process.env.CALLBACK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CALLBACK_SECRET}`,
          },
          body: JSON.stringify({
            originalKey: key,
            compressedKey: compressedKey,
            compressedFileSize: compressedSize,
          }),
        });
        console.log("Callback response:", callbackResponse.status);
      } catch (callbackError) {
        console.warn("Callback failed (non-fatal):", callbackError.message);
      }
    }

    // Cleanup
    try { unlinkSync(inputPath); } catch (e) {}
    try { unlinkSync(outputPath); } catch (e) {}

    return {
      statusCode: 200,
      body: JSON.stringify({ original: key, compressed: compressedKey, size: compressedSize }),
    };
  } catch (error) {
    console.error("Compression failed:", error);
    try { unlinkSync(inputPath); } catch (e) {}
    try { unlinkSync(outputPath); } catch (e) {}
    return { statusCode: 200, body: JSON.stringify({ skipped: true, error: error.message }) };
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

    console.log("FFmpeg args:", args.join(" "));
    const ffmpeg = spawn("/opt/bin/ffmpeg", args);

    let stderr = "";
    ffmpeg.stderr.on("data", (data) => { stderr += data.toString(); });
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exit ${code}: ${stderr.slice(-500)}`));
    });
    ffmpeg.on("error", reject);
  });
}
LAMBDA_CODE

# Create zip
cd "$WORK_DIR"
zip -j function.zip index.mjs
echo "   Created function.zip"

# Step 3: Create or update Lambda function
echo ""
echo "3️⃣  Deploying Lambda function..."

# FFmpeg layer ARN (public layer for eu-west-1)
FFMPEG_LAYER="arn:aws:lambda:us-east-1:368653567616:layer:AWSLambda-FFmpeg:1"

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME 2>/dev/null; then
  echo "   Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --output text > /dev/null
else
  echo "   Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs18.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 600 \
    --memory-size 1024 \
    --ephemeral-storage Size=1024 \
    --environment "Variables={TARGET_WIDTH=$TARGET_WIDTH,CRF=$CRF,PRESET=$PRESET}" \
    --output text > /dev/null
fi

# Wait for function to be ready
echo "   Waiting for function to be ready..."
aws lambda wait function-active --function-name $FUNCTION_NAME 2>/dev/null || sleep 5

# Try to add FFmpeg layer
echo "   Adding FFmpeg layer..."
aws lambda update-function-configuration \
  --function-name $FUNCTION_NAME \
  --layers $FFMPEG_LAYER \
  --timeout 600 \
  --memory-size 1024 \
  --environment "Variables={TARGET_WIDTH=$TARGET_WIDTH,CRF=$CRF,PRESET=$PRESET}" \
  --output text > /dev/null 2>&1 || echo "   (Layer may need manual setup - see note below)"

echo "   Function deployed: $FUNCTION_NAME"

# Step 4: Add S3 trigger
echo ""
echo "4️⃣  Configuring S3 trigger..."

# Add permission for S3 to invoke Lambda
aws lambda add-permission \
  --function-name $FUNCTION_NAME \
  --statement-id "s3-trigger-$(date +%s)" \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$BUCKET_NAME" \
  --source-account $ACCOUNT_ID \
  --output text > /dev/null 2>&1 || echo "   Permission may already exist"

# Get Lambda ARN
LAMBDA_ARN=$(aws lambda get-function --function-name $FUNCTION_NAME --query 'Configuration.FunctionArn' --output text)

# Create S3 notification configuration
NOTIFICATION_CONFIG='{
  "LambdaFunctionConfigurations": [
    {
      "LambdaFunctionArn": "'"$LAMBDA_ARN"'",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {"Name": "prefix", "Value": "memoria/"},
            {"Name": "suffix", "Value": ".mp4"}
          ]
        }
      }
    },
    {
      "LambdaFunctionArn": "'"$LAMBDA_ARN"'",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {"Name": "prefix", "Value": "memoria/"},
            {"Name": "suffix", "Value": ".mov"}
          ]
        }
      }
    },
    {
      "LambdaFunctionArn": "'"$LAMBDA_ARN"'",
      "Events": ["s3:ObjectCreated:*"],
      "Filter": {
        "Key": {
          "FilterRules": [
            {"Name": "prefix", "Value": "memoria/"},
            {"Name": "suffix", "Value": ".MOV"}
          ]
        }
      }
    }
  ]
}'

aws s3api put-bucket-notification-configuration \
  --bucket $BUCKET_NAME \
  --notification-configuration "$NOTIFICATION_CONFIG" 2>&1 || echo "   ⚠️  S3 trigger may need manual setup"

# Cleanup
rm -rf "$WORK_DIR"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Summary:"
echo "   - Lambda: $FUNCTION_NAME"
echo "   - Resolution: ${TARGET_WIDTH}p"
echo "   - Bucket: $BUCKET_NAME"
echo "   - Trigger: memoria/*.mp4, memoria/*.mov"
echo ""
echo "⚠️  IMPORTANT: You may need to manually add an FFmpeg layer."
echo "   Go to AWS Console → Lambda → $FUNCTION_NAME → Layers → Add layer"
echo "   Search for 'ffmpeg' in AWS Serverless Application Repository"
echo ""
echo "🧪 Test by uploading a video to s3://$BUCKET_NAME/memoria/"
echo "   Check CloudWatch logs for compression results"
