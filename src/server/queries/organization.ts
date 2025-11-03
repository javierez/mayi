"use server";

import { db } from "../db";
import { organizations } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Organization } from "../../lib/data";

// Create a new organization
export async function createOrganization(data: Omit<Organization, "orgId">) {
  try {
    const [result] = await db.insert(organizations).values(data).returning();
    if (!result) throw new Error("Failed to create organization");
    const [newOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.orgId, BigInt(result.orgId)));
    return newOrg;
  } catch (error) {
    console.error("Error creating organization:", error);
    throw error;
  }
}

// Get organization by ID
export async function getOrganizationById(orgId: number) {
  try {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.orgId, BigInt(orgId)));
    return org;
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw error;
  }
}

// Get organization by name
export async function getOrganizationByName(orgName: string) {
  try {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.orgName, orgName));
    return org;
  } catch (error) {
    console.error("Error fetching organization by name:", error);
    throw error;
  }
}

// Update organization
export async function updateOrganization(
  orgId: number,
  data: Omit<Partial<Organization>, "orgId">,
) {
  try {
    await db
      .update(organizations)
      .set(data)
      .where(eq(organizations.orgId, BigInt(orgId)));
    const [updatedOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.orgId, BigInt(orgId)));
    return updatedOrg;
  } catch (error) {
    console.error("Error updating organization:", error);
    throw error;
  }
}

// Delete organization
export async function deleteOrganization(orgId: number) {
  try {
    await db
      .delete(organizations)
      .where(eq(organizations.orgId, BigInt(orgId)));
    return { success: true };
  } catch (error) {
    console.error("Error deleting organization:", error);
    throw error;
  }
}

// List all organizations (with pagination)
export async function listOrganizations(page = 1, limit = 10) {
  try {
    const offset = (page - 1) * limit;
    const allOrgs = await db
      .select()
      .from(organizations)
      .limit(limit)
      .offset(offset);
    return allOrgs;
  } catch (error) {
    console.error("Error listing organizations:", error);
    throw error;
  }
}
