// src/types/types.ts
var validateGenreRemixerConfig = (runtime) => {
  const apiUrl = runtime.getSetting("GENRE_REMIXER_API_URL") || "https://genre-remixer-api.fly.dev";
  return {
    apiUrl
  };
};

// src/services/genreRemixerService.ts
var genreRemixerService = (config) => {
  const { apiUrl } = config;
  return {
    /**
     * Get a list of available genres for remixing
     */
    getGenres: async () => {
      try {
        const response = await fetch(`${apiUrl}/genres`);
        if (!response.ok) {
          throw new Error(`Failed to fetch genres: ${response.statusText}`);
        }
        const data = await response.json();
        return data.genres;
      } catch (error) {
        console.error("Error fetching genres:", error.message || String(error));
        throw error;
      }
    },
    /**
     * Remix an audio file to a specific genre
     * @param audioData - The audio file as a Uint8Array
     * @param genre - The target genre
     */
    remixAudio: async (audioData, genre) => {
      try {
        const formData = new FormData();
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        formData.append("file", audioBlob, "input.wav");
        formData.append("genre", genre);
        const response = await fetch(`${apiUrl}/remix`, {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          throw new Error(`Failed to remix audio: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error remixing audio:", error.message || String(error));
        throw error;
      }
    }
  };
};
var genreRemixerService_default = genreRemixerService;

// src/actions/listGenres.ts
var listGenres = {
  name: "GENRE_REMIXER_LIST_GENRES",
  similes: ["LIST_AVAILABLE_GENRES", "SHOW_MUSIC_GENRES", "WHAT_GENRES_ARE_AVAILABLE"],
  description: "Lists all available genres for audio remixing",
  validate: async (runtime) => {
    return validateGenreRemixerConfig(runtime) !== null;
  },
  handler: async (runtime, callback) => {
    try {
      const config = validateGenreRemixerConfig(runtime);
      const service = genreRemixerService_default(config);
      const genres = await service.getGenres();
      const response = `Available genres for remixing:
${genres.join(", ")}`;
      callback?.({
        text: response
      });
      return true;
    } catch (error) {
      callback?.({
        text: `Failed to get available genres: ${error.message || String(error)}`
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
          action: "LIST_AVAILABLE_GENRES"
        }
      },
      {
        user: "{{user2}}",
        content: {
          text: "Can you show me the music genres?",
          action: "SHOW_MUSIC_GENRES"
        }
      },
      {
        user: "{{user3}}",
        content: {
          text: "What genres are available for remixing?",
          action: "WHAT_GENRES_ARE_AVAILABLE"
        }
      },
      {
        user: "{{user4}}",
        content: {
          text: "List all available genres for me.",
          action: "LIST_AVAILABLE_GENRES"
        }
      }
    ]
  ]
};

// src/index.ts
var remixPlugin = {
  name: "story",
  description: "Story integration plugin",
  providers: [],
  evaluators: [],
  services: [],
  actions: [
    listGenres
    // remixAudio
  ]
};
var index_default = remixPlugin;
export {
  index_default as default,
  genreRemixerService,
  listGenres,
  remixPlugin,
  validateGenreRemixerConfig
};
//# sourceMappingURL=index.js.map