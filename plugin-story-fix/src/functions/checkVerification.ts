import { ethers } from "ethers";

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

export const checkVerification = async (subject_address: string) => {
    try {
      const isVerified = await vcContract.isVerified(subject_address);
      return isVerified;
    } catch (error) {
      console.error("Error checking verification:", error);
      throw error;
    }
  };
