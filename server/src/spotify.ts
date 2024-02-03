import type {
  GetPlaylistTracksResponse,
  SongInfo,
  SpotifyTrack,
} from "./types";

const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
if (!clientId || !clientSecret) {
  throw new Error("Missing Spotify credentials");
}

const token = (async function getToken() {
  const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64"
  );
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const res = await handleResponse(response);
  if (
    res &&
    typeof res === "object" &&
    "access_token" in res &&
    typeof res.access_token === "string"
  ) {
    return res.access_token;
  }
  throw new Error("Invalid token response");
})();

async function handleResponse(response: Response) {
  if (!response.ok) {
    console.error(response);
    try {
      console.log(await response.text());
    } catch (e) {
      console.error(e);
    }
    throw new Error(response.statusText);
  }
  return response.json();
}

async function querySpotify<T>(query: string) {
  const URL = `https://api.spotify.com/v1/${query}`;
  const response = await fetch(URL, {
    headers: {
      Authorization: `Bearer ${await token}`,
    },
  });
  return handleResponse(response) as T;
}

const getPlaylistTracks = (playlistId: string, offset: number) =>
  querySpotify<GetPlaylistTracksResponse>(
    `playlists/${playlistId}/tracks?offset=${offset}&limit=50`
  );

async function getAllPlaylistTracks(playlistId: string) {
  const tracks: SpotifyTrack[] = [];
  let offset = 0;
  let response: GetPlaylistTracksResponse;
  do {
    response = await getPlaylistTracks(playlistId, offset);
    tracks.push(...response.items.map((i) => i.track));
    offset += response.items.length;
  } while (response.next);
  return tracks;
}

export async function getPlaylistSongInfo(
  playlistId: string
): Promise<SongInfo[]> {
  const tracks = await getAllPlaylistTracks(playlistId);
  return tracks.map((track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((a) => a.name),
    albumCover: track.album.name,
    previewUrl: track.preview_url,
  }));
}
