{import React from "react";
import { useAppSelector } from "./store";

const Lobby: React.FC = () => {
  const lobby = useAppSelector((state) => state.lobby);

  function joinRoom(id: string) {
    console.log("Joining room", id);
  }

  return (
    <div>
      {lobby.rooms.map((room) => (
        <div key={room.id}>
          <button onClick={() => joinRoom(room.id)}>
            {room.name} ({room.players} players) - {room.status}
          </button>
        </div>
      ))}
    </div>
  );
};

export default Lobby;
