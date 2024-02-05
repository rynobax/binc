import React, { useState } from "react";
import { startRoom } from "./websocket";
import { Button, Flex, TextFieldInput, Text } from "@radix-ui/themes";
import { redirectToAuthCodeFlow } from "./login";
import { useAppSelector } from "./store";

interface CreateProps {}

const Create: React.FC<CreateProps> = () => {
  const [roomName, setRoomName] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const isLoggedIn = useAppSelector((state) => !!state.user.spotifyToken);

  function login() {
    redirectToAuthCodeFlow();
  }

  return (
    <>
      <Flex direction="column" gap="4">
        {isLoggedIn ? (
          <>
            <TextFieldInput
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Room Name"
            />
            <TextFieldInput
              value={playlistId}
              onChange={(e) => setPlaylistId(e.target.value)}
              placeholder="Enter a Spotify playlist ID"
            />
            <Button
              disabled={!roomName || !playlistId}
              color="green"
              onClick={() => startRoom(roomName, [playlistId])}
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
