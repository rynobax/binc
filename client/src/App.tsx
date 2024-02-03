import { useState } from "react";
import "./App.css";
import { startRoom } from "./websocket";
import Lobby from "./Lobby";
import { useAppSelector, userSlice } from "./store";
import Room from "./Room";

function App() {
  const [nameConfirmed, setNameConfirmed] = useState(true);
  const username = useAppSelector((state) => state.user.name);
  const inRoom = useAppSelector((state) => state.room.room);
  const [playlistId, setPlaylistId] = useState("37i9dQZEVXbLRQDuF5jeBp");
  if (!nameConfirmed) {
    return (
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => userSlice.actions.setName(e.target.value)}
        />
        <button disabled={!username} onClick={() => setNameConfirmed(true)}>
          Choose Name
        </button>
      </div>
    );
  }

  if (inRoom) return <Room />;

  return (
    <>
      <h1>binc</h1>
      <div>
        <input
          type="text"
          value={playlistId}
          onChange={(e) => setPlaylistId(e.target.value)}
        />
        <button onClick={() => startRoom([playlistId])}>Create Room</button>
      </div>
      <Lobby />
    </>
  );
}

export default App;
