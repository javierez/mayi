"use server";

import { db } from "~/server/db";
import {
  accounts,
  users,
  userRoles,
  websiteProperties,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Get the correct agent name and collegiate number based on account type
 */
export async function getAgentNameAction(accountId: bigint): Promise<{
  success: boolean;
  agentName?: string;
  accountName?: string; // Agency/company name
  collegiateNumber?: string;
  accountType?: string;
  taxId?: string;
  website?: string;
  signatureUrl?: string; // Account's default signature URL
  error?: string;
}> {
  try {
    // First get the account information
    const [account] = await db
      .select({
        accountType: accounts.accountType,
        name: accounts.name,
        collegiateNumber: accounts.collegiateNumber,
        taxId: accounts.taxId,
        website: accounts.website,
        signatureUrl: accounts.signatureUrl,
      })
      .from(accounts)
      .where(eq(accounts.accountId, accountId));

    if (!account) {
      return { success: false, error: "Account not found" };
    }

    // Store account name for "on behalf of" display
    const accountName = account.name;

    // If account type is company, use account.name
    if (account.accountType === "company") {
      return {
        success: true,
        agentName: account.name,
        accountName: accountName,
        collegiateNumber: account.collegiateNumber ?? undefined,
        accountType: account.accountType,
        taxId: account.taxId ?? undefined,
        website: account.website ?? undefined,
      };
    }

    // If account type is person, get user with role_id = 3
    if (account.accountType === "person") {
      const [userWithRole] = await db
        .select({
          userName: users.name,
        })
        .from(users)
        .innerJoin(userRoles, eq(users.id, userRoles.userId))
        .where(
          and(eq(users.accountId, accountId), eq(userRoles.roleId, BigInt(3))),
        );

      if (userWithRole) {
        return {
          success: true,
          agentName: userWithRole.userName,
          accountName: accountName,
          collegiateNumber: account.collegiateNumber ?? undefined,
          accountType: account.accountType,
          taxId: account.taxId ?? undefined,
          website: account.website ?? undefined,
        };
      } else {
        // Fallback to any user in the account if no role 3 found
        const [anyUser] = await db
          .select({
            userName: users.name,
          })
          .from(users)
          .where(eq(users.accountId, accountId));

        if (anyUser) {
          return {
            success: true,
            agentName: anyUser.userName,
            accountName: accountName,
            collegiateNumber: account.collegiateNumber ?? undefined,
            accountType: account.accountType,
            taxId: account.taxId ?? undefined,
            website: account.website ?? undefined,
          };
        }
      }
    }

    // Fallback to account name if nothing else works
    return {
      success: true,
      agentName: account.name,
      accountName: accountName,
      collegiateNumber: account.collegiateNumber ?? undefined,
      accountType: account.accountType ?? undefined,
      taxId: account.taxId ?? undefined,
      website: account.website ?? undefined,
    };
  } catch (error) {
    console.error("Error getting agent name:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get office information from website configuration
 */
export async function getOfficeInfoAction(accountId: bigint): Promise<{
  success: boolean;
  offices?: Array<{
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  }>;
  error?: string;
}> {
  try {
    const [websiteConfig] = await db
      .select({
        contactProps: websiteProperties.contactProps,
      })
      .from(websiteProperties)
      .where(eq(websiteProperties.accountId, accountId));

    if (!websiteConfig?.contactProps) {
      return { success: false, error: "Website configuration not found" };
    }

    // Parse contactProps JSON
    let contactProps: unknown;
    try {
      contactProps =
        typeof websiteConfig.contactProps === "string"
          ? JSON.parse(websiteConfig.contactProps)
          : websiteConfig.contactProps;
    } catch (parseError) {
      console.error("Error parsing contactProps:", parseError);
      return { success: false, error: "Invalid website configuration data" };
    }

    // Extract and format offices
    const parsedContactProps = contactProps as { offices?: unknown[] };
    const offices =
      parsedContactProps?.offices?.map((office: unknown) => {
        const officeData = office as {
          address?: { street?: string; city?: string; state?: string };
          phoneNumbers?: { main?: string };
        };
        return {
          address: officeData.address?.street ?? "",
          city: officeData.address?.city ?? "",
          postalCode: officeData.address?.state ?? "",
          phone: officeData.phoneNumbers?.main ?? "",
        };
      }) ?? [];

    return {
      success: true,
      offices: offices.filter(
        (office) => office.address ?? office.city ?? office.phone,
      ),
    };
  } catch (error) {
    console.error("Error getting office info:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
