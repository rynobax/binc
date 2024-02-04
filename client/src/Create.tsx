import React, { useState } from "react";
import { startRoom } from "./websocket";
import { Button, Flex, TextFieldInput } from "@radix-ui/themes";

interface CreateProps {}

const Create: React.FC<CreateProps> = () => {
  const [roomName, setRoomName] = useState("");
  const [playlistId, setPlaylistId] = useState("37i9dQZEVXbLRQDuF5jeBp");
  return (
    <>
      <Flex direction="column" gap="4">
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
      </Flex>
    </>
  );
};

export default Create;
