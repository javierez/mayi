"use server";

import { getCurrentUserAccountId } from "~/lib/dal";
import { getWebsiteConfigurationAction } from "~/app/actions/website-settings";

export interface AccountContext {
  agencyName?: string;
  contactInfo: {
    phone?: string;
    email?: string;
    address?: string;
    website?: string;
  };
  branding: {
    logo?: string;
  };
  description?: string;
  offices?: Array<{
    id: string;
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    };
    phoneNumbers: {
      main: string;
      sales?: string;
    };
    emailAddresses: {
      info: string;
      sales?: string;
    };
    scheduleInfo: {
      weekdays: string;
      saturday: string;
      sunday: string;
    };
    mapUrl: string;
    isDefault?: boolean;
  }>;
}

/**
 * Fetches account context for personalizing property descriptions
 * Uses website configuration which contains all the contact and branding info
 */
export async function fetchAccountContext(): Promise<AccountContext | null> {
  try {
    // Get current user's account ID
    const accountId = await getCurrentUserAccountId();

    if (!accountId) {
      console.log("No account ID found for current user");
      return null;
    }

    // Fetch website configuration which contains all the info we need
    const configResult = await getWebsiteConfigurationAction(BigInt(accountId));

    if (!configResult.success || !configResult.data) {
      console.log(
        `Website configuration not found for account ID: ${accountId}`,
      );
      return null;
    }

    const config = configResult.data;

    // Extract contact information from contactProps
    const contactProps = config.contactProps || {};
    const footerProps = config.footerProps || {};

    // Build account context from website configuration
    const accountContext: AccountContext = {
      agencyName: config.accountName ?? footerProps.companyName ?? undefined,
      contactInfo: {
        // Extract contact info from first office if available
        phone: contactProps.offices?.[0]?.phoneNumbers?.main ?? undefined,
        email: contactProps.offices?.[0]?.emailAddresses?.info ?? undefined,
        address: contactProps.offices?.[0]?.address
          ? `${contactProps.offices[0].address.street}, ${contactProps.offices[0].address.city}, ${contactProps.offices[0].address.state}, ${contactProps.offices[0].address.country}`
          : undefined,
      },
      branding: {
        logo: config.logo ?? undefined,
      },
      description: footerProps.description ?? undefined,
      offices: contactProps.offices ?? [],
    };

    console.log(
      `🏢 ACCOUNT CONTEXT: Using account name: ${config.accountName}`,
    );
    console.log(
      `🏪 ACCOUNT CONTEXT: Company name fallback: ${footerProps.companyName}`,
    );
    console.log(
      `✅ ACCOUNT CONTEXT: Final agency name: ${accountContext.agencyName ?? "Unknown Agency"}`,
    );
    return accountContext;
  } catch (error) {
    console.error("Error fetching account context:", error);
    // Return null to allow graceful fallback
    return null;
  }
}

/**
 * Formats account context into a readable string for GPT-4 prompts
 */
export async function formatAccountContextForPrompt(
  context: AccountContext,
): Promise<string> {
  const lines: string[] = [];

  lines.push(`COMPANY CONTEXT:`);

  if (context.agencyName) {
    lines.push(`- Agency Name: ${context.agencyName}`);
  }

  // Contact information
  const contactLines: string[] = [];
  if (context.contactInfo.phone) {
    contactLines.push(`Phone: ${context.contactInfo.phone}`);
  }
  if (context.contactInfo.email) {
    contactLines.push(`Email: ${context.contactInfo.email}`);
  }
  if (context.contactInfo.address) {
    contactLines.push(`Address: ${context.contactInfo.address}`);
  }

  if (contactLines.length > 0) {
    lines.push(`- Contact Information: ${contactLines.join(", ")}`);
  }

  // Company description if available
  if (context.description) {
    lines.push(`- Company Description: ${context.description}`);
  }

  // Multiple offices if available
  if (context.offices && context.offices.length > 0) {
    lines.push(`- Office Locations:`);
    context.offices.forEach((office, index) => {
      const officeInfo: string[] = [];
      if (office.name) officeInfo.push(office.name);
      if (office.address) {
        const addressStr = `${office.address.street}, ${office.address.city}, ${office.address.state}, ${office.address.country}`;
        officeInfo.push(addressStr);
      }
      if (office.phoneNumbers?.main)
        officeInfo.push(`Phone: ${office.phoneNumbers.main}`);
      if (office.emailAddresses?.info)
        officeInfo.push(`Email: ${office.emailAddresses.info}`);

      if (officeInfo.length > 0) {
        lines.push(`  ${index + 1}. ${officeInfo.join(" - ")}`);
      }
    });
  }

  lines.push("");
  lines.push("INSTRUCTIONS FOR USING COMPANY CONTEXT:");
  lines.push(
    '- Naturally incorporate the agency name when appropriate (e.g., "Contact [Agency Name] for more information")',
  );
  lines.push(
    "- Include relevant contact information in call-to-action phrases",
  );
  lines.push(
    "- Match the professional tone that represents this specific agency",
  );
  lines.push(
    "- Make the description feel authentic to this company's brand identity",
  );
  lines.push("- Do not force company information if it doesn't flow naturally");

  return lines.join("\n");
}
