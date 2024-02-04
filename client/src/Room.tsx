import React from "react";
import { useAppSelector } from "./store";
import { leaveRoom, readyUp } from "./websocket";
import Game from "./Game";

const Room: React.FC = () => {
  const room = useAppSelector((state) => state.room.room);
  const name = useAppSelector((state) => state.user.name);
  if (!room) throw new Error("Room not found");
  const self = room.users.find((user) => user.name === name);
  if (!self) throw new Error("User not found");

  return (
    <div>
      <h1>{room.name}</h1>
      <ul>
        {room.users.map((player) => (
          <li key={player.id}>
            {player.name} {player.ready ? "✅" : "❌"}
          </li>
        ))}
      </ul>
      {room.gameState.type === "paused" ? (
        <div>{!self.ready && <button onClick={readyUp}>Ready</button>}</div>
      ) : (
        <div>
          <Game room={room} />
        </div>
      )}
      <button onClick={leaveRoom}>Leave room</button>
    </div>
  );
};

export default Room;
