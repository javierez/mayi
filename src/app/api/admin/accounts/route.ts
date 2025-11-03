import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getSecureSession } from "~/lib/dal";
import { hasPermission, PERMISSIONS } from "~/lib/permissions";

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await getSecureSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const isAdmin = await hasPermission(PERMISSIONS.ADMIN_FULL_ACCESS);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get all accounts
    const allAccounts = await db.select().from(accounts);

    return NextResponse.json({ accounts: allAccounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSecureSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin permissions
    const isAdmin = await hasPermission(PERMISSIONS.ADMIN_FULL_ACCESS);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      plan?: string;
    };

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Account name is required" },
        { status: 400 },
      );
    }

    // Create the new account
    const [newAccount] = await db
      .insert(accounts)
      .values({
        name: body.name.trim(),
        email: body.email ?? null,
        phone: body.phone ?? null,
        website: body.website ?? null,
        address: body.address ?? null,
        plan: body.plan ?? "basic",
      })
      .returning();

    if (!newAccount) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 },
      );
    }

    // Get the created account
    const [createdAccount] = await db
      .select()
      .from(accounts)
      .where(eq(accounts.accountId, newAccount.accountId));

    return NextResponse.json({
      success: true,
      account: createdAccount,
      inviteCode: newAccount.accountId.toString(), // For now, use account ID as invite code
    });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
