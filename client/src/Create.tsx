import React, { useState } from "react";
import { startRoom } from "./websocket";
import {
  Button,
  Flex,
  TextFieldInput,
  Text,
  DropdownMenu,
  Grid,
  IconButton,
} from "@radix-ui/themes";
import { redirectToAuthCodeFlow } from "./login";
import { useAppSelector } from "./store";
import { defaultPlaylists } from "./data";

interface CreateProps {}

const Create: React.FC<CreateProps> = () => {
  const [roomName, setRoomName] = useState("");
  const [playlistIds, setPlaylistIds] = useState<string[]>([""]);
  const isLoggedIn = useAppSelector((state) => !!state.user.spotifyToken);

  function login() {
    redirectToAuthCodeFlow();
  }

  function addPlaylist() {
    setPlaylistIds([...playlistIds, ""]);
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
            {playlistIds.map((playlistId, i) => {
              const playlistName = defaultPlaylists.find(
                (p) => p.id === playlistId
              )?.name;
              return (
                <Flex gap="2" align="center">
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
                  <TextFieldInput
                    value={playlistName ? playlistName : playlistId}
                    disabled={!!playlistName}
                    onChange={(e) => {
                      const newPlaylistIds = [...playlistIds];
                      newPlaylistIds[i] = e.target.value;
                      setPlaylistIds(newPlaylistIds);
                    }}
                    placeholder="Enter a Spotify playlist ID"
                  />
                </Flex>
              );
            })}
            <Grid columns="2" gapX="2">
              <Button onClick={addPlaylist} variant="ghost">
                + playlist
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button variant="ghost">default playlists</Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  {defaultPlaylists.map((playlist) => (
                    <DropdownMenu.Item
                      key={playlist.id}
                      onSelect={() => {
                        const newPlaylistIds = [...playlistIds];
                        newPlaylistIds.push(playlist.id);
                        setPlaylistIds(newPlaylistIds);
                      }}
                    >
                      {playlist.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Grid>
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
