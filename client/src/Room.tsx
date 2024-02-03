import React, { useEffect, useRef, useState } from "react";
import { store, useAppSelector } from "./store";
import { leaveRoom, readyUp, submitCorrectGuess } from "./websocket";

function createAudioElement() {
  const el = document.createElement("audio");
  el.preload = "auto";
  return el;
}

const Room: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const room = useAppSelector((state) => state.room.room);
  const name = useAppSelector((state) => state.user.name);
  if (!room) throw new Error("Room not found");
  const self = room.users.find((user) => user.name === name);
  if (!self) throw new Error("User not found");
  const audioRef = useRef(createAudioElement());

  useEffect(() => {
    if (room.gameState.type === "paused") return;
    if (audioRef.current.src !== room.gameState.songUrl) {
      audioRef.current.src = room.gameState.songUrl;
      audioRef.current.load();
    }
    if (room.gameState.type === "playing") audioRef.current.play();
    else audioRef.current.pause();
  }, [room.gameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = store.getState().room.room?.gameState;
      if (!state || state.type === "paused" || state.type === "queued") {
        setProgress(0);
      } else {
        const audioDuration = audioRef.current.duration;
        const audioCurrentTime = audioRef.current.currentTime;
        setProgress((audioCurrentTime / audioDuration) * 100);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
      <button onClick={() => submitCorrectGuess("title")}>Guess Title</button>
      <button onClick={() => submitCorrectGuess("artist")}>Guess Artist</button>
      {progress}
    </div>
  );
};

export default Room;
