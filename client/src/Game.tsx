import React, { useEffect, useRef, useState } from "react";
import { store } from "./store";
import { ClientRoom } from "../../shared/shared";

function createAudioElement() {
  const el = document.createElement("audio");
  el.preload = "auto";
  el.volume = 0;
  return el;
}

interface GameProps {
  room: ClientRoom;
}

const Game: React.FC<GameProps> = ({ room }) => {
  const [progress, setProgress] = useState(0);
  const [guess, setGuess] = useState("");
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
      <div>
        Current Song
        <progress value={progress} max="100" />
      </div>
      <div>
        <input value={guess} onChange={(e) => setGuess(e.target.value)} />
      </div>
    </div>
  );
};

export default Game;
