import { useState } from "react";
import "./App.css";
import { startRoom } from "./websocket";

function App() {
  const [nameConfirmed, setNameConfirmed] = useState(true);
  const [username, setUsername] = useState("nukeydog");
  const [playlistId, setPlaylistId] = useState("37i9dQZEVXbLRQDuF5jeBp");
  if (!nameConfirmed) {
    return (
      <div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button disabled={!username} onClick={() => setNameConfirmed(true)}>
          Choose Name
        </button>
      </div>
    );
  }
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
    </>
  );
}

export default App;
