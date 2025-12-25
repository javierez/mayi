import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import { generateGmailAuthUrl } from "~/lib/google-gmail";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the origin from the request URL to ensure redirect URI matches
    const origin = request.nextUrl.origin;

    // Generate a state parameter for CSRF protection
    const state = nanoid(32);

    // Include the user ID and origin in the state for verification
    const encodedOrigin = Buffer.from(origin).toString("base64");
    const stateData = `${user.id}:${state}:${encodedOrigin}`;

    // Generate OAuth consent URL with origin for correct redirect URI
    const authUrl = generateGmailAuthUrl(stateData, origin);

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Gmail connection:", error);
    return NextResponse.json(
      { error: "Failed to initiate Gmail connection" },
      { status: 500 }
    );
  }
}
