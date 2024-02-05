import React from "react";
import { useAppSelector } from "./store";
import { leaveRoom, readyUp } from "./websocket";
import Game from "./Game";
import { Badge, Button, Flex, Heading, Text } from "@radix-ui/themes";

const Room: React.FC = () => {
  const room = useAppSelector((state) => state.room.room);
  const name = useAppSelector((state) => state.user.name);
  if (!room) throw new Error("Room not found");
  const self = room.users.find((user) => user.name === name);
  if (!self) throw new Error("User not found");

  return (
    <Flex direction="column" gap="5">
      <Heading as="h1" align="center">
        {room.name}
      </Heading>
      <Flex direction="column" gap="2">
        {room.gameState.type === "paused" && (
          <Flex gap="9">
            <Flex gap="2" direction="column">
              {room.users.map((user) => (
                <div key={user.id}>
                  <Flex gap="2">
                    {user.ready ? (
                      <Badge color="green">ready</Badge>
                    ) : (
                      <Badge color="gray">waiting</Badge>
                    )}
                    <Text>{user.name}</Text>
                  </Flex>
                </div>
              ))}
            </Flex>
            {room.gameState.previousGameScores && (
              <Flex direction="column">
                <Text weight="bold">Previous Results</Text>
                {room.gameState.previousGameScores.map((user) => (
                  <Flex gap="2" key={user.name}>
                    <Text>
                      {user.score} - {user.name}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            )}
          </Flex>
        )}
      </Flex>
      {room.gameState.type === "paused" ? (
        <>{!self.ready && <Button onClick={readyUp}>Ready</Button>}</>
      ) : (
        <Game room={room} />
      )}
      <Button onClick={leaveRoom} variant="soft">
        Leave room
      </Button>
    </Flex>
  );
};

export default Room;
