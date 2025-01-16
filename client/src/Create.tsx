import React, { useState } from "react";
import { startRoom } from "./websocket";
import {
  Button,
  Flex,
  TextFieldInput,
  Text,
  DropdownMenu,
  IconButton,
} from "@radix-ui/themes";
import { redirectToAuthCodeFlow } from "./login";
import { defaultPlaylists } from "./data";
import { parsePlaylistId } from "./util";

interface CreateProps {}

const Create: React.FC<CreateProps> = () => {
  const [roomName, setRoomName] = useState("");
  const [playlistIds, setPlaylistIds] = useState<string[]>([]);
  // const isLoggedIn = useAppSelector((state) => !!state.user.spotifyToken);
  const isLoggedIn = true;

  function login() {
    redirectToAuthCodeFlow();
  }

  const validPlaylistIds = playlistIds.filter((id) => id.length > 0);

  return (
    <>
      <Flex direction="column" gap="4" style={{ minWidth: 240 }}>
        {isLoggedIn ? (
          <>
            <TextFieldInput
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
            />
            <TextFieldInput
              onChange={(e) => {
                const newPlaylistIds = [...playlistIds];
                const newPlaylistId = parsePlaylistId(e.target.value);
                if (!newPlaylistId) {
                  console.warn("Invalid playlist id", e.target.value);
                  return;
                }
                newPlaylistIds.push(newPlaylistId);
                setPlaylistIds(newPlaylistIds);
                // clear input
                e.target.value = "";
              }}
              placeholder="Enter a youtube playlist url"
            />
            {playlistIds.map((playlistId, i) => {
              const playlistName =
                defaultPlaylists.find((p) => p.id === playlistId)?.name ||
                playlistId;
              return (
                <Flex gap="2" align="center" key={i}>
                  <IconButton
                    color="red"
                    variant="soft"
                    size="1"
                    onClick={() => {
                      const newPlaylistIds = [...playlistIds];
                      newPlaylistIds.splice(i, 1);
                      setPlaylistIds(newPlaylistIds);
                    }}
                  >
                    -
                  </IconButton>
                  <Text>{playlistName}</Text>
                </Flex>
              );
            })}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button variant="ghost">default playlists</Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                {defaultPlaylists.map((playlist) => (
                  <DropdownMenu.Item
                    key={playlist.id}
                    onSelect={() => {
                      const isEmptyState =
                        playlistIds.length === 1 && playlistIds[0] === "";
                      const newPlaylistIds = isEmptyState
                        ? []
                        : [...playlistIds];
                      newPlaylistIds.push(playlist.id);
                      setPlaylistIds(newPlaylistIds);
                    }}
                  >
                    {playlist.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Root>
            <Button
              disabled={!roomName || validPlaylistIds.length === 0}
              color="green"
              onClick={() => startRoom(roomName, validPlaylistIds)}
            >
              Create New Room
            </Button>
          </>
        ) : (
          <>
            <Text>To create a room, login with Spotify</Text>
            <Button color="green" onClick={login}>
              Login with Spotify
            </Button>
          </>
        )}
      </Flex>
    </>
  );
};

export default Create;
