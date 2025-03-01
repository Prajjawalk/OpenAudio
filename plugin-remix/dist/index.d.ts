import { Action, IAgentRuntime, Plugin } from '@elizaos/core';

declare const listGenres: Action;

interface GenreRemixerConfig {
    apiUrl: string;
}
interface GenresResponse {
    genres: string[];
}
interface RemixResponse {
    remixedFileUrl: string;
    originalGenre?: string;
    targetGenre: string;
    processingTime?: number;
}
declare const validateGenreRemixerConfig: (runtime: IAgentRuntime) => GenreRemixerConfig;

declare const genreRemixerService: (config: GenreRemixerConfig) => {
    /**
     * Get a list of available genres for remixing
     */
    getGenres: () => Promise<string[]>;
    /**
     * Remix an audio file to a specific genre
     * @param audioData - The audio file as a Uint8Array
     * @param genre - The target genre
     */
    remixAudio: (audioData: Uint8Array, genre: string) => Promise<RemixResponse>;
};

declare const remixPlugin: Plugin;

export { type GenreRemixerConfig, type GenresResponse, type RemixResponse, remixPlugin as default, genreRemixerService, listGenres, remixPlugin, validateGenreRemixerConfig };
