/**
 * Test script to verify Better Auth password hashing
 * Run with: npx tsx test-password-hash.ts
 */

import { hashPassword, verifyPassword } from "better-auth/crypto";

async function testPasswordHashing() {
  const testPassword = "Test1234";

  console.log("🔐 Testing Better Auth password hashing...\n");

  // Hash the password
  console.log("1. Hashing password:", testPassword);
  const hashedPassword = await hashPassword(testPassword);
  console.log("   Hash result:", hashedPassword.substring(0, 40) + "...");
  console.log("   Hash length:", hashedPassword.length);
  console.log("   Hash format:", hashedPassword.substring(0, 10));

  // Verify the password
  console.log("\n2. Verifying password against hash...");
  const isValid = await verifyPassword({
    password: testPassword,
    hash: hashedPassword,
  });
  console.log("   Verification result:", isValid ? "✅ VALID" : "❌ INVALID");

  // Test with wrong password
  console.log("\n3. Testing with wrong password...");
  const wrongPassword = "WrongPassword123";
  const isInvalid = await verifyPassword({
    password: wrongPassword,
    hash: hashedPassword,
  });
  console.log("   Verification result:", isInvalid ? "❌ SHOULD BE INVALID" : "✅ Correctly rejected");
}

testPasswordHashing().catch(console.error);
