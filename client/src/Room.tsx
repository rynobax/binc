import React from "react";
import { useAppSelector } from "./store";
import { leaveRoom, readyUp } from "./websocket";

const Room: React.FC = () => {
  const room = useAppSelector((state) => state.room.room);
  const name = useAppSelector((state) => state.user.name);
  if (!room) throw new Error("Room not found");
  const self = room.users.find((user) => user.name === name);
  if (!self) throw new Error("User not found");
  return (
    <div>
      <h1>{room.name}</h1>
      <p>{room.status}</p>
      <p>Players:</p>
      <ul>
        {room.users.map((player) => (
          <li key={player.id}>
            {player.name} {player.ready ? "✅" : "❌"}
          </li>
        ))}
      </ul>
      {!self.ready && <button onClick={readyUp}>Ready</button>}
      <button onClick={leaveRoom}>Leave room</button>
    </div>
  );
};

export default Room;
