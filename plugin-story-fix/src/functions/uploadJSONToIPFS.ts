import { PinataSDK } from "pinata-web3";

export async function uploadJSONToIPFS(
    pinata: PinataSDK,
    jsonMetadata: Record<string, unknown>  // Replaced any with Record<string, unknown>
): Promise<string> {
    const { IpfsHash } = await pinata.upload.json(jsonMetadata);
    return IpfsHash;
}
