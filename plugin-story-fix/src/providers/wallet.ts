import type { IAgentRuntime, Provider, Memory, State } from "@elizaos/core";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatUnits,
  type PublicClient,
  type WalletClient,
  type Chain,
  type HttpTransport,
  type Address,
  type Account,
  type Transport,
  defineChain,
} from "viem";
import type { SupportedChain, ChainMetadata } from "../types";
import { privateKeyToAccount } from "viem/accounts";
import { StoryClient, type StoryConfig } from "@story-protocol/core-sdk";

export const storyAeneid = /*#__PURE__*/ defineChain({
    id: 1315,
    name: 'Story Aeneid',
    network: 'story-aeneid',
    nativeCurrency: {
      decimals: 18,
      name: 'IP',
      symbol: 'IP',
    },
    rpcUrls: {
      default: { http: ['https://aeneid.storyrpc.io'] },
    },
    blockExplorers: {
      default: {
        name: 'Story Aeneid Explorer',
        url: 'https://aeneid.storyscan.xyz',
      },
    },
    contracts: {
      multicall3: {
        address: '0xca11bde05977b3631167028862be2a173976ca11',
        blockCreated: 1792,
      },
    },
    testnet: true,
  })

export const DEFAULT_CHAIN_CONFIGS: Record<SupportedChain, ChainMetadata> = {
  aeneid: {
    chainId: 1315,
    name: "Aeneid Testnet",
    chain: storyAeneid,
    rpcUrl: "https://aeneid.storyrpc.io/",
    nativeCurrency: {
      name: "IP",
      symbol: "IP",
      decimals: 18,
    },
    blockExplorerUrl: "https://aeneid.storyscan.xyz",
  },
} as const;

export class WalletProvider {
  private storyClient: StoryClient;
  private publicClient: PublicClient<HttpTransport, Chain, Account | undefined>;
  private walletClient: WalletClient;
  private address: Address;
  runtime: IAgentRuntime;

  constructor(runtime: IAgentRuntime) {
    const privateKey = runtime.getSetting("STORY_PRIVATE_KEY");
    if (!privateKey) throw new Error("STORY_PRIVATE_KEY not configured");

    this.runtime = runtime;

    const account = privateKeyToAccount(privateKey as Address);
    this.address = account.address;

    const config: StoryConfig = {
      account: account,
      transport: http(DEFAULT_CHAIN_CONFIGS.aeneid.rpcUrl),
      chainId: "aeneid",
    };
    this.storyClient = StoryClient.newClient(config);

    const baseConfig = {
      chain: storyAeneid,
      transport: http(DEFAULT_CHAIN_CONFIGS.aeneid.rpcUrl),
    } as const;
    this.publicClient = createPublicClient<HttpTransport>(
      baseConfig
    ) as PublicClient<HttpTransport, Chain, Account | undefined>;

    this.walletClient = createWalletClient<HttpTransport>({
      chain: storyAeneid,
      transport: http(DEFAULT_CHAIN_CONFIGS.aeneid.rpcUrl),
      account: account.address as `0x${string}`,
    });
  }

  getAddress(): Address {
    return this.address;
  }

  async getWalletBalance(): Promise<string | null> {
    try {
      const balance = await this.publicClient.getBalance({
        address: this.address,
      });
      return formatUnits(balance, 18);
    } catch (error) {
      console.error("Error getting wallet balance:", error);
      return null;
    }
  }

  async connect(): Promise<`0x${string}`> {
    return this.runtime.getSetting("STORY_PRIVATE_KEY") as `0x${string}`;
  }

  getPublicClient(): PublicClient<HttpTransport, Chain, Account | undefined> {
    return this.publicClient;
  }

  getWalletClient(): WalletClient {
    if (!this.walletClient) throw new Error("Wallet not connected");
    return this.walletClient;
  }

  getStoryClient(): StoryClient {
    if (!this.storyClient) throw new Error("StoryClient not connected");
    return this.storyClient;
  }
}

export const storyWalletProvider: Provider = {
  async get(
    runtime: IAgentRuntime,
    // eslint-disable-next-line
    _message: Memory,
    // eslint-disable-next-line
    _state?: State
  ): Promise<string | null> {
    // Check if the user has a Story wallet
    if (!runtime.getSetting("STORY_PRIVATE_KEY")) {
      return null;
    }

    try {
      const walletProvider = new WalletProvider(runtime);
      const address = walletProvider.getAddress();
      const balance = await walletProvider.getWalletBalance();
      return `Story Wallet Address: ${address}\nBalance: ${balance} IP`;
    } catch (error) {
      console.error("Error in Story wallet provider:", error);
      return null;
    }
  },
};
