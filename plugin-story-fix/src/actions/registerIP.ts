import {
    composeContext,
    elizaLogger,
    generateObjectDeprecated,
    type HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";
import {PinataSDK} from "pinata-web3";
import type { LicenseTerms, RegisterIpResponse } from "@story-protocol/core-sdk";
import { createHash } from "node:crypto";  // Added node: protocol
import { uploadJSONToIPFS } from "../functions/uploadJSONToIPFS";
import { WalletProvider } from "../providers/wallet";
import { registerIPTemplate } from "../templates";
import type { RegisterIPParams } from "../types";
import { zeroAddress, zeroHash } from "viem";
import { checkVerification } from "../functions/checkVerification";

export { registerIPTemplate };

const commercialRemixTerms: LicenseTerms = {
    transferable: true,
    royaltyPolicy: '0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E', // RoyaltyPolicyLAP address from https://docs.story.foundation/docs/deployed-smart-contracts
    defaultMintingFee: 0n,
    expiration: 0n,
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: zeroAddress,
    commercialRevShare: 50, // can claim 50% of derivative revenue
    commercialRevCeiling: 0n,
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: 0n,
    currency: '0x1514000000000000000000000000000000000000', // $WIP address from https://docs.story.foundation/docs/deployed-smart-contracts
    uri: '',
  }

  const licensingConfig = {
    isSet: false,
    mintingFee: 0n,
    licensingHook: zeroAddress,
    hookData: zeroHash,
    commercialRevShare: 0,
    disabled: false,
    expectMinimumGroupRewardShare: 0,
    expectGroupRewardPool: zeroAddress,
  };


export class RegisterIPAction {
    constructor(private walletProvider: WalletProvider) {}

    async registerIP(
        params: RegisterIPParams,
        runtime: IAgentRuntime
    ): Promise<RegisterIpResponse> {
        const storyClient = this.walletProvider.getStoryClient();

        if (!params.mediaUrl.startsWith('http://') && !params.mediaUrl.startsWith('https://')) {
            params.mediaUrl = 'https://' + params.mediaUrl;
        }

        // configure ip metadata
        const ipMetadata = storyClient.ipAsset.generateIpMetadata({
            title: params.title,
            description: params.description,
            ipType: params.ipType ? params.ipType : undefined,
            creators: params.creatorName? [{
                name: params.creatorName,
                address: this.walletProvider.getAddress(),
                contributionPercent: 100
            }] : undefined,
            media: params.mediaUrl ? [{
                name: params.title,
                url: params.mediaUrl,
                mimeType: params.mimeType,
            }]: undefined
        });

        // configure nft metadata
        const nftMetadata = {
            name: params.title,
            description: params.description,
        };

        const pinataJWT = runtime.getSetting("PINATA_JWT");
        if (!pinataJWT) throw new Error("PINATA_JWT not configured");
        const pinata = new PinataSDK({ pinataJwt: pinataJWT });

        // upload metadata to ipfs
        const ipIpfsHash = await uploadJSONToIPFS(pinata, ipMetadata);
        const ipHash = createHash("sha256")
            .update(JSON.stringify(ipMetadata))
            .digest("hex");
        const nftIpfsHash = await uploadJSONToIPFS(pinata, nftMetadata);
        const nftHash = createHash("sha256")
            .update(JSON.stringify(nftMetadata))
            .digest("hex");

        // register ip
        const response =
            await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
                spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
                licenseTermsData: [{
                    terms: commercialRemixTerms,
                    licensingConfig: licensingConfig
                }],
                allowDuplicates: true,
                ipMetadata: {
                    ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
                    ipMetadataHash: `0x${ipHash}`,
                    nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
                    nftMetadataHash: `0x${nftHash}`,
                },
                recipient: this.walletProvider.getAddress(),
                txOptions: { waitForTransaction: true },
            });

        return response;
    }
}

export const registerIPAction = {
    name: "REGISTER_IP",
    description: "Register an NFT as an IP Asset on Story",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: Record<string, unknown>,
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.log("Starting REGISTER_IP handler...");

        // initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        const registerIPContext = composeContext({
            state: currentState,
            template: registerIPTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context: registerIPContext,
            modelClass: ModelClass.SMALL,
        });

        const requiredFields = ['title', 'description', 'creatorName', 'mediaUrl', 'mimeType'];
        const missingFields = requiredFields.filter(field => !content[field]);

        if (missingFields.length > 0) {
            callback?.({
                text: `Please provide the following details: ${missingFields.join(', ')}.`,
            });
            return false; // Prevent further execution
        }

        const walletProvider = new WalletProvider(runtime);
        const action = new RegisterIPAction(walletProvider);


        try {
            // Check for verification
            const verified = await checkVerification(walletProvider.getAddress());
            if (!verified) {
                callback?.({
                    text: `Artist needs to verify first, please verify using /verifyCredential`,
                });
                return false;
            } else {
                callback?.({
                    text: `Artist successfully verified!`,
                });
            }

            const response = await action.registerIP(content, runtime);
            callback?.({
                text: `Successfully registered IP ID: ${response.ipId}. Transaction Hash: ${response.txHash}. View it on the explorer: https://aeneid.explorer.story.foundation/ipa/${response.ipId}`,
            });
            return true;
        } catch (e) {
            elizaLogger.error("Error registering IP:", e.message);
            callback?.({ text: `Error registering IP: ${e.message}` });
            return false;
        }
    },
    template: registerIPTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("STORY_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I would like to register my IP.",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Sure! Please provide the title, description of your IP, creator's name, url of your media and its mime type.",
                    action: "REGISTER_IP",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Register my IP titled 'My IP' with the description 'This is my IP'.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "I want to register an IP titled 'My Artwork' with the description 'A beautiful piece of art'. My name is 'John Doe', and here is the media URL: 'https://example.com/artwork.jpg' with mime type 'image/jpeg'.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Please register my IP titled 'My Music' with the description 'An original song'. The creator's name is 'Jane Smith', media URL is 'https://example.com/music.mp3', and the mime type is 'audio/mpeg'.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "I would like to register my IP titled 'My Book' with the description 'A thrilling novel'. The creator is 'Alice Johnson', media URL is 'https://example.com/book.pdf', and the mime type is 'application/pdf'.",
                },
            },
            {
                user: "{{user1}}",
                content: {
                    text: "Register my IP titled 'My Game' with the description 'An exciting adventure game'. Creator's name is 'Bob Brown', media URL is 'https://example.com/game.zip', and mime type is 'application/zip'.",
                },
            },
        ],
    ],
    similes: ["REGISTER_IP", "REGISTER_NFT"],
};
