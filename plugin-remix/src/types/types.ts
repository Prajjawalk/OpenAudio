import { type IAgentRuntime } from "@elizaos/core";

// Configuration for the Genre Remixer API
export interface GenreRemixerConfig {
  apiUrl: string;
}

// Response from the GET /genres endpoint
export interface GenresResponse {
  genres: string[];
}

// Response from the POST /remix endpoint
export interface RemixResponse {
  remixedFileUrl: string;
  originalGenre?: string;
  targetGenre: string;
  processingTime?: number;
}

// Helper function to validate configuration
export const validateGenreRemixerConfig = (runtime: IAgentRuntime): GenreRemixerConfig => {
  const apiUrl = runtime.getSetting("GENRE_REMIXER_API_URL") || "https://genre-remixer-api.fly.dev";

  return {
    apiUrl
  };
};
