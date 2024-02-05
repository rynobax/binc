import { shuffle } from "../../shared/shared";
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

async function querySpotify<T>(query: string, clientToken: string) {
  const URL = `https://api.spotify.com/v1/${query}`;
  console.log(clientToken);
  const response = await fetch(URL, {
    headers: {
      // Authorization: `Bearer ${await token}`,
      Authorization: `Bearer ${clientToken}`,
    },
  });
  return handleResponse(response) as T;
}

const getPlaylistTracks = (
  playlistId: string,
  offset: number,
  clientToken: string
) =>
  querySpotify<GetPlaylistTracksResponse>(
    `playlists/${playlistId}/tracks?offset=${offset}&limit=50`,
    clientToken
  );

const getTrackById = (trackId: string, clientToken: string) =>
  querySpotify<SpotifyTrack>(`tracks/${trackId}`, clientToken);

async function getAllPlaylistTracks(playlistId: string, clientToken: string) {
  const tracks: SpotifyTrack[] = [];
  let offset = 0;
  let response: GetPlaylistTracksResponse;
  do {
    response = await getPlaylistTracks(playlistId, offset, clientToken);
    tracks.push(...response.items.map((i) => i.track));
    offset += response.items.length;
  } while (response.next);
  return tracks;
}

function cleanSongName(name: string) {
  const withoutParen = name.split(" (")[0];
  const withoutDash = withoutParen.split(" - ")[0];
  return withoutDash;
}

export async function getPlaylistSongInfo(
  playlistId: string,
  clientToken: string
): Promise<SongInfo[]> {
  const tracks = await getAllPlaylistTracks(playlistId, clientToken);
  const playableTracks = tracks.filter((track) => track.preview_url);
  const unplayableTracks = tracks.filter((track) => !track.preview_url);
  const numPlayableTracks = playableTracks.length;
  const numTracks = tracks.length;
  const pctPlayable = (numPlayableTracks / numTracks) * 100;
  if (unplayableTracks.length > 0) {
    console.log(
      `${pctPlayable}% of tracks are playable (${numPlayableTracks}/${numTracks})`
    );
  }
  return (
    shuffle(playableTracks)
      // TODO: REMOVE THIS
      .slice(20)
      .map((track) => ({
        id: track.id,
        title: cleanSongName(track.name),
        artists: track.artists.map((a) => a.name),
        albumCover: track.album.name,
        previewUrl: track.preview_url,
        promotionalLink: track.external_urls.spotify,
      }))
  );
}
