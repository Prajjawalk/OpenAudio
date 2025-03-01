// export const listGenreTemplate = `Given the recent messages below:

// {{recentMessages}}

// Extract the following information about the requested IP registration:
// - Field "title": The title of your IP. **Do not search the web for any information related to the title.**
// - Field "description": The description of your IP. **Do not search the web for any information related to the description.**
// - Field "ipType": The type of your IP. **Do not search the web for any information related to the IP type.**
// - Field "creatorName": The name of the creator. **Do not search the web for any information related to the creator's name.**
// - Field "mediaUrl": The media url for the media provided by the creator. Should be included in description or provided by artist. If not found, ask the user directly for the media URL. **Do not search the web for the URL, do not attempt to access it, validate it, or use any web search tools. Simply collect the URL as provided by the user.**
// - Field "mimeType": The mimetype is the mime type of media url, ask for the mime type if not provided or extract from media url. **Do not search the web for any information related to the mime type.**

// Respond with a JSON markdown block containing only the extracted values. A user must explicitly provide a title and description.

// \`\`\`json
// {
//     "title": string,
//     "description": string,
//     "ipType": string,
//     "creatorName": string,
//     "mediaUrl": string,
//     "mimeType": string,
// }
// \`\`\`
// `;
