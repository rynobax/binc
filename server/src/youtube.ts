import { google, youtube_v3 } from "googleapis";
import type { SongInfo } from "./types";

function parseSongDetails(videoTitle: string) {
  const [artist, title] = videoTitle.split(" - ");
  return { artist, title };
}

const youtube = google.youtube("v3");

export async function getPlaylistSongs(
  playlistId: string
): Promise<SongInfo[]> {
  const googleAuthKey = process.env.YOUTUBE_API_KEY;
  if (!googleAuthKey) throw new Error("Missing youtube API key");

  const results: youtube_v3.Schema$PlaylistItem[] = [];
  let pageToken: any = undefined;
  while (true) {
    const result = await youtube.playlistItems.list({
      playlistId,
      part: ["snippet"],
      auth: googleAuthKey,
      maxResults: 50,
      pageToken,
    });
    const { nextPageToken, items } = result.data;
    if (items) results.push(...items);
    pageToken = nextPageToken;
    if (!pageToken) break;
  }

  return results
    .map((item): SongInfo | null => {
      if (!item.snippet) throw new Error("No snippet found");
      const id = item.snippet.resourceId?.videoId;
      if (!id) {
        console.warn("No video id found", item);
        return null;
      }
      const videoTitle = item.snippet.title;
      if (!videoTitle) {
        console.warn("No video title found", item);
        return null;
      }

      const { artist, title } = parseSongDetails(videoTitle);

      if (!artist || !title) {
        console.warn("Failed to parse video title", videoTitle);
        return null;
      }

      return {
        albumCover: item.snippet.thumbnails?.default?.url || "",
        artists: [artist],
        id,
        link: `https://www.youtube.com/watch?v=${id}`,
        previewUrl: "",
        title,
        youtubeUrl: `https://www.youtube.com/watch?v=${id}`,
      };
    })
    .filter((e): e is SongInfo => e !== null);
}
