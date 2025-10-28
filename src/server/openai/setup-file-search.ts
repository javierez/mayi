"use server";

import { uploadExamplesFile } from "./property_descriptions";

/**
 * One-time setup script to upload examples file to OpenAI
 * Run this script once to set up examples file for property descriptions
 */
export async function setupPropertyExamplesFileUpload() {
  try {
    console.log(
      "🚀 Setting up Examples File Upload for Property Description Examples...",
    );

    // Step 1: Fetch examples from S3 (or wherever they are stored)
    const { fetchPropertyExamplesFromS3 } = await import("../s3-utils");
    const examplesText = await fetchPropertyExamplesFromS3();

    if (!examplesText) {
      throw new Error(
        "No examples found in S3. Please ensure examples are uploaded to S3 first.",
      );
    }

    console.log("📄 Examples text loaded from S3");

    // Step 2: Upload the examples file to OpenAI
    console.log("⬆️ Uploading examples file to OpenAI...");
    const fileId = await uploadExamplesFile(
      examplesText,
      "property-description-examples.txt",
    );

    console.log(`✅ File uploaded with ID: ${fileId}`);

    // Step 3: Instructions for environment variables
    console.log("\n🎯 SETUP COMPLETE!");
    console.log("Add this environment variable to your .env file:");
    console.log(`OPENAI_EXAMPLES_FILE_ID=${fileId}`);
    console.log(
      "\nAfter adding this to your .env file, restart your application.",
    );

    return {
      success: true,
      fileId,
      instructions: {
        fileId,
        envVar: {
          OPENAI_EXAMPLES_FILE_ID: fileId,
        },
      },
    };
  } catch (error) {
    console.error("❌ Setup failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Test the file upload functionality
 */
export async function testFileUpload() {
  try {
    console.log("🧪 Testing file upload functionality...");

    // Import the generate function
    const { generatePropertyDescription } = await import(
      "./property_descriptions"
    );

    // Test with a sample property
    const testProperty = {
      propertyType: "apartment",
      title: "Modern Apartment in City Center",
      price: 250000,
      listingType: "sale",
      squareMeter: 85,
      bedrooms: 2,
      bathrooms: 1,
      terrace: true,
      terraceSize: 15,
    };

    console.log("🏠 Generating test property description...");
    const description = await generatePropertyDescription(testProperty);

    console.log("✅ Test completed successfully!");
    console.log("Generated description:", description);

    return {
      success: true,
      description,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
