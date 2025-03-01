import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const BACKEND_URL = "http://localhost:3000/api"; // Update if running on a different port

// Sample wallet address for testing
const TEST_WALLET = "0xF09b95815aA7f20854a9B1792bb7C44e33b3816f"; // Replace with an actual test wallet address

async function testIssueCredential() {
  console.log("\n🔹 Testing Credential Issuance...");

  try {
    const response = await fetch(`${BACKEND_URL}/issue-credential`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject_address: TEST_WALLET,
        credentialType: "music_rights",
      }),
    });

    const text = await response.text(); // Read raw response before parsing JSON
    console.log("🔍 Raw Response:", text);

    const data = JSON.parse(text);
    console.log("✅ Credential Issued Response:", data);
  } catch (error) {
    console.error("❌ Error in testIssueCredential:", error);
  }
}

async function testRegisterArtist() {
  console.log("\n🔹 Testing Artist Registration...");

  const response = await fetch(`${BACKEND_URL}/register-artist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      artistAddress: TEST_WALLET,
    }),
  });

  const data = await response.json();
  console.log("✅ Artist Registration Response:", data);
}

// Run Tests
(async () => {
  await testIssueCredential();
  await testRegisterArtist();
})();
