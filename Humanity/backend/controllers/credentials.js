import {
  issueCredential,
  markCredentialOnChain,
  checkVerification,
  getCredentialDetails,
  verifyCredentialByAddress,
  revokeCredentialAll,
} from "../services/humanityservices.js";

/**
 * Issue a credential off-chain (Humanity) and on-chain (MusicDistribution).
 */
export const issueCredentialController = async (req, res) => {
  try {
    console.log("Inside issueCredentialController");
    const { subject_address, credentialType } = req.body;

    // 1) Off-chain issuance
    const credentialResult = await issueCredential(
      subject_address,
      credentialType
    );
    console.log("Credential Result: ", credentialResult);

    // 2) Check if off-chain issuance was successful
    if (credentialResult.message !== "Credential issued successfully") {
      throw new Error("Credential issuance failed");
    }

    // 3) Mark the credential as issued on-chain
    const txHash = await markCredentialOnChain(subject_address, credentialType);

    return res.json({ success: true, txHash });
  } catch (error) {
    console.error("Error in issueCredentialController:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Check if the given address is verified on Humanity Protocol (on-chain).
 */
export const checkVerificationController = async (req, res) => {
  try {
    console.log("Inside checkVerificationController");
    const { subject_address } = req.body;
    const verified = await checkVerification(subject_address);
    return res.json({ verified });
  } catch (error) {
    console.error("Error in checkVerificationController:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Get the total number of credentials and the list of credential types for an address.
 */
export const getCredentialDetailsController = async (req, res) => {
  try {
    console.log("Inside getCredentialDetailsController");
    const { subject_address } = req.body;
    const details = await getCredentialDetails(subject_address);
    return res.json(details);
  } catch (error) {
    console.error("Error in getCredentialDetailsController:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Verify a credential by address + type (off-chain) using Humanity’s verify endpoint.
 */
export const verifyCredentialController = async (req, res) => {
  try {
    console.log("Inside verifyCredentialController");
    const { subject_address, credentialType } = req.body;

    const verificationResult = await verifyCredentialByAddress(
      subject_address,
      credentialType
    );
    return res.json(verificationResult);
  } catch (error) {
    console.error("Error in verifyCredentialController:", error);
    return res.status(500).json({ error: error.message });
  }
};

/**
 * Revoke a credential both on-chain and off-chain (Humanity).
 */
export const revokeCredentialController = async (req, res) => {
  try {
    console.log("Inside revokeCredentialController");
    const { subject_address, credentialType } = req.body;

    const revokeResult = await revokeCredentialAll(
      subject_address,
      credentialType
    );
    // e.g., { txHash, humanityRevokeMessage }

    return res.json({
      success: true,
      txHash: revokeResult.txHash,
      humanityMessage: revokeResult.humanityRevokeMessage,
    });
  } catch (error) {
    console.error("Error in revokeCredentialController:", error);
    return res.status(500).json({ error: error.message });
  }
};
