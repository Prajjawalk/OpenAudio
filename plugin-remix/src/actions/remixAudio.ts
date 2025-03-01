// src/actions/remixAudio.ts
import { Action, type IAgentRuntime } from "@elizaos/core";
import { validateGenreRemixerConfig } from "../types/types";
import genreRemixerService from "../services/genreRemixerService";

export const remixAudio: Action = {
  name: "GENRE_REMIXER_REMIX_AUDIO",
  similes: ["REMIX_SONG", "TRANSFORM_MUSIC", "CHANGE_GENRE"],
  description: "Remixes an audio file to a specific genre",

  validate: async (runtime: IAgentRuntime) => {
    return validateGenreRemixerConfig(runtime);
  },

  handler: async (runtime: IAgentRuntime, state: any, callback: Function) => {
    try {
      // Extract parameters from the state
      const { audioFile, genre } = state;

      if (!audioFile) {
        await callback("No audio file provided for remixing");
        return false;
      }

      if (!genre) {
        await callback("No target genre specified for remixing");
        return false;
      }

      // Get audio file data
      let audioData: Uint8Array;

      if (typeof audioFile === "string") {
        // If audioFile is a URL or path, download or read it
        try {
          const response = await fetch(audioFile);
          const arrayBuffer = await response.arrayBuffer();
          audioData = new Uint8Array(arrayBuffer);
        } catch (error: any) {
          await callback(
            `Failed to retrieve audio file: ${error.message || String(error)}`
          );
          return false;
        }
      } else if (audioFile instanceof Uint8Array) {
        // If audioFile is already a Uint8Array
        audioData = audioFile;
      } else {
        await callback("Invalid audio file format");
        return false;
      }

      const config = validateGenreRemixerConfig(runtime);
      const service = genreRemixerService(config);

      // Notify user of processing
      await callback(`Processing your audio file for ${genre} remix...`);

      // Send to API for remixing
      const result = await service.remixAudio(audioData, genre);

      // Return the remixed audio URL
      await callback(
        `Your remixed audio in ${genre} style is ready: ${result.remixedFileUrl}`
      );

      return true;
    } catch (error: any) {
      await callback(
        `Failed to remix audio: ${error.message || String(error)}`
      );
      return false;
    }
  },
};

export default remixAudio;
