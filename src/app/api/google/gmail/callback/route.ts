import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCurrentUser } from "~/lib/dal";
import {
  exchangeCodeForTokens,
  storeGmailIntegration,
} from "~/lib/google-gmail";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth error
    if (error) {
      console.error("Gmail OAuth error:", error);
      return NextResponse.redirect(
        new URL(`/inbox?error=oauth_failed`, request.url)
      );
    }

    // Validate required parameters
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/inbox?error=invalid_callback`, request.url)
      );
    }

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.redirect(
        new URL(`/inbox?error=unauthorized`, request.url)
      );
    }

    // Parse state parameter: userId:randomState:encodedOrigin
    const stateParts = state.split(":");
    const stateUserId = stateParts[0];
    const encodedOrigin = stateParts[2];

    // Verify state parameter matches user
    if (stateUserId !== user.id) {
      return NextResponse.redirect(
        new URL(`/inbox?error=invalid_state`, request.url)
      );
    }

    // Decode the origin from state
    let origin: string | undefined;
    if (encodedOrigin) {
      try {
        origin = Buffer.from(encodedOrigin, "base64").toString("utf-8");
      } catch {
        console.warn("Failed to decode origin from state, using request origin");
        origin = request.nextUrl.origin;
      }
    } else {
      origin = request.nextUrl.origin;
    }

    try {
      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code, origin);

      if (!tokens?.access_token) {
        throw new Error("No access token received");
      }

      // Store tokens in database
      await storeGmailIntegration(user.id, tokens);

      // Redirect back to inbox with success message
      return NextResponse.redirect(
        new URL(`/inbox?success=gmail_connected`, request.url)
      );
    } catch (tokenError) {
      console.error("Error exchanging Gmail tokens:", tokenError);
      return NextResponse.redirect(
        new URL(`/inbox?error=token_exchange_failed`, request.url)
      );
    }
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    return NextResponse.redirect(
      new URL(`/inbox?error=callback_failed`, request.url)
    );
  }
}
