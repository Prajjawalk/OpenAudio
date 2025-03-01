// src/actions/listGenres.ts
import { Action, IAgentRuntime } from "@elizaos/core";
import { validateGenreRemixerConfig } from "../types/types";
import genreRemixerService from "..//services/genreRemixerService";

export const listGenres: Action = {
  name: "GENRE_REMIXER_LIST_GENRES",
  similes: ["LIST_AVAILABLE_GENRES", "SHOW_MUSIC_GENRES", "WHAT_GENRES_ARE_AVAILABLE"],
  description: "Lists all available genres for audio remixing",

  validate: async (runtime: IAgentRuntime) => {
    return validateGenreRemixerConfig(runtime) !== null;
  },

  handler: async (runtime: IAgentRuntime, callback: any) => {
    try {
      const config = validateGenreRemixerConfig(runtime);
      const service = genreRemixerService(config);

      // Fetch available genres
      const genres = await service.getGenres();

      // Build a nice response
      const response = `Available genres for remixing:\n${genres.join(", ")}`;

    callback?.({
        text: response,
        });
      return true;
    } catch (error: any) {
      callback?.({
        text: `Failed to get available genres: ${error.message || String(error)}`,
    });
      return false;
    }
  },

  // Example usage of the action
  examples: [
    [
        {
            user: "{{user1}}",
            content: {
                text: "I want to know all genres for remixing",
                action: "LIST_AVAILABLE_GENRES",
            },
        },
        {
            user: "{{user2}}",
            content: {
                text: "Can you show me the music genres?",
                action: "SHOW_MUSIC_GENRES",
            },
        },
        {
            user: "{{user3}}",
            content: {
                text: "What genres are available for remixing?",
                action: "WHAT_GENRES_ARE_AVAILABLE",
            },
        },
        {
            user: "{{user4}}",
            content: {
                text: "List all available genres for me.",
                action: "LIST_AVAILABLE_GENRES",
            },
        },
    ],
  ],
};

export default listGenres;
