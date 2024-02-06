import React from "react";
import { useAppSelector } from "./store";
import { joinRoom } from "./websocket";
import { Button, Flex, Text } from "@radix-ui/themes";

const Lobby: React.FC = () => {
  const lobby = useAppSelector((state) => state.lobby.lobby);
  const name = useAppSelector((state) => state.user.name);

  return (
    <Flex direction="column" gap="4">
      {lobby.rooms.map((room) => {
        return (
          <Button
            color="violet"
            variant="soft"
            disabled={room.status !== "creating"}
            onClick={() => joinRoom(room.id, name)}
            key={room.id}
          >
            {room.name} ({room.players} players) - {room.status}
          </Button>
        );
      })}
      {!lobby.rooms.length && <Text>{"No rooms yet :("}</Text>}
    </Flex>
  );
};

export default Lobby;
