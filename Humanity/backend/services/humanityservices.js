import { createRequire } from "module";
const require = createRequire(import.meta.url);
import fetch from "node-fetch";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// Import the contract ABI using require.
const contractABI = require("../contractABI.json");

// In-memory credential cache, keyed by "address:credentialType"
const credentialCache = {};

/**
 * Helper functions to get/set from the cache
 */
function getCachedCredential(address, credentialType) {
  return credentialCache[`${address.toLowerCase()}:${credentialType}`];
}

function setCachedCredential(address, credentialType, credentialJson) {
  credentialCache[`${address.toLowerCase()}:${credentialType}`] =
    credentialJson;
}

// Set the chainId from your environment or default to 1942999413.
const chainId = process.env.CHAIN_ID
  ? Number(process.env.CHAIN_ID)
  : 1942999413;

// Create a provider with custom network settings.
const provider = new ethers.JsonRpcProvider(process.env.HUMANITY_RPC_URL, {
  chainId,
  name: "custom",
  ensAddress: null,
});

// Override ENS-related methods to disable ENS resolution.
provider.getNetwork = async () => ({
  chainId,
  name: "custom",
  ensAddress: null,
  getPlugin: () => undefined,
});
provider.getEnsAddress = async (_name) => null;
provider.resolveName = async (_name) => null;
provider.lookupAddress = async (_address) => null;

const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Create an instance of your MusicDistribution contract.
const musicContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  signer
);

/**
 * Issues a credential by calling Humanity's API and returns the response.
 * If successful, we store the returned credential JSON in our in-memory cache.
 */
export const issueCredential = async (subject_address, credentialType) => {
  try {
    const response = await fetch(
      "https://issuer.humanity.org/credentials/issue",
      {
        method: "POST",
        headers: {
          "X-API-Token": process.env.HUMANITY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject_address,
          claims: { kyc: "passed" },
          credentialType, // Off-chain credential type
        }),
      }
    );
    const resp = await response.json();
    console.log("Issue Credential Response:", resp);

    // If successful, store the credential JSON so we can verify or revoke later
    if (resp.message === "Credential issued successfully") {
      setCachedCredential(subject_address, credentialType, resp.credential);
    }

    return resp;
  } catch (error) {
    console.error("Error issuing credential:", error);
    throw error;
  }
};

/**
 * Marks the credential as issued on-chain.
 */
export const markCredentialOnChain = async (
  subject_address,
  credentialType
) => {
  try {
    const credentialKey = ethers.encodeBytes32String(credentialType);
    const alreadyIssued = await musicContract.hasCredential(
      subject_address,
      credentialKey
    );
    if (alreadyIssued) {
      return "Credential already issued";
    }

    const tx = await musicContract.markCredentialIssued(
      subject_address,
      credentialKey,
      {
        gasLimit: 300000,
      }
    );
    await tx.wait();
    console.log("Transaction successful, hash:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Error marking credential on-chain:", error);
    throw error;
  }
};

/**
 * Checks if the given address is verified on Humanity Protocol (on-chain check).
 * Uses the IVC contract's isVerified function.
 */
const vcContractABI = [
  "function isVerified(address _user) view returns (bool)",
];
const vcContract = new ethers.Contract(
  process.env.VC_CONTRACT_ADDRESS,
  vcContractABI,
  provider
);

export const checkVerification = async (subject_address) => {
  try {
    const isVerified = await vcContract.isVerified(subject_address);
    return isVerified;
  } catch (error) {
    console.error("Error checking verification:", error);
    throw error;
  }
};

/**
 * Gets the total number of credentials and the list of credential types for an address.
 */
export const getCredentialDetails = async (subject_address) => {
  try {
    const count = await musicContract.getCredentialCount(subject_address);
    const typesBytes32 = await musicContract.getCredentialTypes(
      subject_address
    );
    // In ethers v6, use ethers.decodeBytes32String instead of parseBytes32String.
    const types = typesBytes32.map((b) => ethers.decodeBytes32String(b));
    return { count: count.toString(), types };
  } catch (error) {
    console.error("Error getting credential details:", error);
    throw error;
  }
};

/**
 * Verifies a credential off-chain using Humanity’s API,
 * automatically fetched from our cache by address + credentialType.
 */
export const verifyCredentialByAddress = async (
  subject_address,
  credentialType
) => {
  // Retrieve the stored credential JSON from the in-memory cache
  const storedCredential = getCachedCredential(subject_address, credentialType);
  if (!storedCredential) {
    throw new Error(
      `No credential JSON found for address=${subject_address}, type=${credentialType}`
    );
  }

  // Send that credential JSON to Humanity’s verify endpoint
  try {
    const response = await fetch(
      "https://issuer.humanity.org/credentials/verify",
      {
        method: "POST",
        headers: {
          "X-API-Token": process.env.HUMANITY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential: storedCredential }),
      }
    );
    const data = await response.json();
    console.log("Verification result:", data);
    return data;
  } catch (error) {
    console.error("Error verifying credential:", error);
    throw error;
  }
};

/**
 * Revoke a credential both on-chain and off-chain (Humanity).
 */
export const revokeCredentialAll = async (subject_address, credentialType) => {
  try {
    // 1) Retrieve the stored credential JSON from the cache (so we can get the credential ID)
    const storedCredential = getCachedCredential(
      subject_address,
      credentialType
    );
    if (!storedCredential) {
      throw new Error(
        `No stored credential found for address=${subject_address}, type=${credentialType}`
      );
    }

    // 2) Revoke On-Chain
    const credentialKey = ethers.encodeBytes32String(credentialType);
    const alreadyIssued = await musicContract.hasCredential(
      subject_address,
      credentialKey
    );
    if (!alreadyIssued) {
      throw new Error("Credential not issued on-chain.");
    }

    const tx = await musicContract.revokeCredential(
      subject_address,
      credentialKey,
      {
        gasLimit: 300000,
      }
    );
    await tx.wait();
    console.log("On-chain credential revoked. TX Hash:", tx.hash);

    // 3) Revoke from Humanity
    const credentialId = storedCredential.id; // e.g., "urn:uuid:1234-..."
    if (!credentialId) {
      throw new Error("No credentialId found in stored credential JSON.");
    }

    const humanityResponse = await fetch(
      "https://issuer.humanity.org/credentials/revoke",
      {
        method: "POST",
        headers: {
          "X-API-Token": process.env.HUMANITY_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credentialId }),
      }
    );
    const revokeResult = await humanityResponse.json();
    console.log("Humanity revoke response:", revokeResult);

    if (revokeResult.message !== "Credential revoked successfully") {
      throw new Error("Failed to revoke credential from Humanity");
    }

    // 4) Remove from cache (optional) so it can't be verified again
    delete credentialCache[
      `${subject_address.toLowerCase()}:${credentialType}`
    ];

    // Return combined result
    return {
      txHash: tx.hash,
      humanityRevokeMessage: revokeResult.message,
    };
  } catch (error) {
    console.error(
      "Error revoking credential (both on-chain and Humanity):",
      error
    );
    throw error;
  }
};

export { musicContract };
