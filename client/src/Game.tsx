import React, { useEffect, useRef, useState } from "react";
import levy from "js-levenshtein";
import { store } from "./store";
import { ClientRoom } from "../../shared/shared";
import { submitCorrectGuess } from "./websocket";
import { incorrectMessages } from "./data";

function doStringsMatch(target: string, guess: string) {
  if (target.length < 4)
    return target.toLocaleLowerCase() === guess.toLocaleLowerCase();
  const distance = levy(target.toLocaleLowerCase(), guess.toLocaleLowerCase());
  return distance <= 3;
}

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
  const [guessResponse, setGuessResponse] = useState("");
  const [incorrectGuessNdx, setIncorrectGuessNdx] = useState(0);
  const [guess, setGuess] = useState("");
  const audioRef = useRef(createAudioElement());

  useEffect(() => {
    if (room.gameState.type === "playing") {
      setGuess("");
    }
  }, [room.gameState.type]);

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

  function processGuess(attemptedGuess: string) {
    if (room.gameState.type === "paused") return;
    let correct = false;
    if (doStringsMatch(room.gameState.songTitle, attemptedGuess)) {
      correct = true;
      submitCorrectGuess("title");
    }
    for (const artist of room.gameState.artistNames) {
      if (doStringsMatch(artist, attemptedGuess)) {
        correct = true;
        submitCorrectGuess("artist");
        break;
      }
    }
    if (!correct) {
      setGuessResponse(
        incorrectMessages[incorrectGuessNdx % incorrectMessages.length]
      );
      setIncorrectGuessNdx(incorrectGuessNdx + 1);
    }
  }

  return (
    <div>
      <div>
        Current Song
        <progress value={progress} max="100" />
      </div>
      <div>
        <div>{guessResponse}</div>
        <input
          disabled={room.gameState.type !== "playing"}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              processGuess(guess);
              setGuess("");
            }
          }}
        />
      </div>
    </div>
  );
};

export default Game;
