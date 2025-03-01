export * from "./actions/listGenres";
export * from "./actions/remixAudio";
export * from "./services/genreRemixerService";
export * from "./types/types";

import type { Plugin } from "@elizaos/core";
import { listGenres } from "./actions/listGenres";
// import { remixAudio } from "./actions/remixAudio";

export const remixPlugin: Plugin = {
    name: "story",
    description: "Story integration plugin",
    providers: [],
    evaluators: [],
    services: [],
    actions: [
        listGenres,
        // remixAudio
    ],
};

export default remixPlugin;
