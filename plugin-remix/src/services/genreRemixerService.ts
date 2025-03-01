// src/services/genreRemixerService.ts
import { GenreRemixerConfig, GenresResponse, RemixResponse } from "../types/types";

export const genreRemixerService = (config: GenreRemixerConfig) => {
  const { apiUrl } = config;

  return {
    /**
     * Get a list of available genres for remixing
     */
    getGenres: async (): Promise<string[]> => {
      try {
        const response = await fetch(`${apiUrl}/genres`);

        if (!response.ok) {
          throw new Error(`Failed to fetch genres: ${response.statusText}`);
        }

        const data = await response.json() as GenresResponse;
        return data.genres;
      } catch (error: any) {
        console.error("Error fetching genres:", error.message || String(error));
        throw error;
      }
    },

    /**
     * Remix an audio file to a specific genre
     * @param audioData - The audio file as a Uint8Array
     * @param genre - The target genre
     */
    remixAudio: async (audioData: Uint8Array, genre: string): Promise<RemixResponse> => {
      try {
        const formData = new FormData();

        // Convert buffer to blob
        const audioBlob = new Blob([audioData], { type: "audio/wav" });
        formData.append("file", audioBlob, "input.wav");
        formData.append("genre", genre);

        const response = await fetch(`${apiUrl}/remix`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to remix audio: ${response.statusText}`);
        }

        return await response.json() as RemixResponse;
      } catch (error: any) {
        console.error("Error remixing audio:", error.message || String(error));
        throw error;
      }
    }
  };
};

export default genreRemixerService;
