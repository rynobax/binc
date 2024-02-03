import React from "react";
import { useAppSelector } from "./store";
import { joinRoom } from "./websocket";

const Lobby: React.FC = () => {
  const lobby = useAppSelector((state) => state.lobby.lobby);
  const name = useAppSelector((state) => state.user.name);

  return (
    <div>
      {lobby.rooms.map((room) => (
        <div key={room.id}>
          <button onClick={() => joinRoom(room.id, name)}>
            {room.name} ({room.players} players) - {room.status}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Lobby;
