import React, { useEffect, useRef, useState } from "react";
import { store, useAppSelector, userSlice } from "./store";
import {
  ClientRoom,
  GameState,
  TIME_BETWEEN_ROUNDS_SEC,
} from "../../shared/shared";
import { submitCorrectGuess } from "./websocket";
import { incorrectMessages } from "./data";
import { Badge, Flex, Slider, Text, TextField } from "@radix-ui/themes";
import { remapToLogScale } from "./util";
import PreviousSongs from "./PreviousSongs";
import { isGuessCorrect } from "./guess";

function timeSinceGameStart(gameState: GameState, time: number) {
  if (gameState.type === "paused") return "";
  if (time === 0) return "";
  const { roundStartTime } = gameState;
  const seconds = (time - roundStartTime) / 1000;
  const secondsStr = seconds.toFixed(1);
  return ` (${secondsStr}s)`;
}

const DEFAULT_VOLUME = 30;

const UPDATE_INTERVAL_MS = 100;
const PROGRESS_BACKWARDS_UPDATE =
  100 / ((TIME_BETWEEN_ROUNDS_SEC * 1000) / UPDATE_INTERVAL_MS);

function setVolumeOnEl(newVolume: number, audio: HTMLAudioElement) {
  if (newVolume === 0) {
    audio.volume = 0;
    return;
  }
  const logVolume = remapToLogScale(newVolume);
  audio.volume = logVolume / 100;
}

function createAudioElement() {
  const el = document.createElement("audio");
  el.preload = "auto";
  setVolumeOnEl(DEFAULT_VOLUME, el);
  return el;
}

interface GameProps {
  room: ClientRoom;
}

const Game: React.FC<GameProps> = ({ room }) => {
  const savedVolume = useAppSelector((state) => state.user.volume);
  const [volume, setVolume] = useState(savedVolume ?? DEFAULT_VOLUME);
  const [progress, setProgress] = useState(0);
  const [guessResponse, setGuessResponse] = useState("");
  const [incorrectGuessNdx, setIncorrectGuessNdx] = useState(0);
  const [guess, setGuess] = useState("");
  const audioRef = useRef(createAudioElement());

  useEffect(function destroyOnUnmount() {
    const audioEl = audioRef.current;
    return () => {
      audioEl.pause();
      audioEl.src = "";
      audioEl.remove();
    };
  }, []);

  useEffect(() => {
    if (room.gameState.type === "paused") {
      setGuess("");
    }
  }, [room.gameState.type]);

  useEffect(() => {
    if (room.gameState.type === "paused") return;
    const currentSongUrl = room.gameState.currentSong?.url;
    if (!currentSongUrl) return;
    if (audioRef.current.src !== currentSongUrl) {
      audioRef.current.src = currentSongUrl;
      audioRef.current.load();
    }
    if (room.gameState.type === "playing") audioRef.current.play();
    else audioRef.current.pause();
  }, [room.gameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = store.getState().room.room?.gameState;
      if (!state || state.type === "paused" || state.type === "queued") {
        setProgress((prevProg) => {
          return Math.max(0, prevProg - PROGRESS_BACKWARDS_UPDATE);
        });
      } else {
        const audioDuration = audioRef.current.duration;
        const audioCurrentTime = audioRef.current.currentTime;
        setProgress((audioCurrentTime / audioDuration) * 100);
      }
    }, UPDATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  function processGuess(attemptedGuess: string) {
    if (room.gameState.type === "paused") return;
    const { currentSong } = room.gameState;
    if (!currentSong) return;
    let correct = false;
    if (isGuessCorrect(currentSong.title, attemptedGuess)) {
      correct = true;
      submitCorrectGuess(currentSong.id, "title");
    }
    for (const artist of currentSong.artistNames) {
      if (isGuessCorrect(artist, attemptedGuess)) {
        correct = true;
        submitCorrectGuess(currentSong.id, "artist");
        break;
      }
    }
    if (!correct) {
      setGuessResponse(
        incorrectMessages[incorrectGuessNdx % incorrectMessages.length]
      );
      setIncorrectGuessNdx(incorrectGuessNdx + 1);
    } else {
      setGuessResponse("");
    }
  }

  function changeVolume(newVolume: number) {
    setVolume(newVolume);
    setVolumeOnEl(newVolume, audioRef.current);
  }

  return (
    <Flex direction="column" gap="8">
      <Flex style={{ minHeight: 100 }} gap="9">
        {room.gameState.type !== "paused" && (
          <>
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold">
                Round {room.gameState.currentRound} of{" "}
                {room.gameState.totalRounds}
              </Text>
              {room.gameState.scores.map((user) => {
                return (
                  <div key={user.name}>
                    <Flex gap="2" style={{ minHeight: 0 }}>
                      <Badge
                        color={user.guesses.title ? "green" : "gray"}
                        variant={user.guesses.title ? "solid" : "soft"}
                        style={{ minWidth: 88 }}
                      >
                        song
                        {timeSinceGameStart(room.gameState, user.guesses.title)}
                      </Badge>
                      <Badge
                        color={user.guesses.artist ? "green" : "gray"}
                        variant={user.guesses.artist ? "solid" : "soft"}
                        style={{ minWidth: 88 }}
                      >
                        artist
                        {timeSinceGameStart(
                          room.gameState,
                          user.guesses.artist
                        )}
                      </Badge>
                      <Text>
                        {user.name} ({user.score})
                      </Text>
                    </Flex>
                  </div>
                );
              })}
            </Flex>
            {room.gameState.previousSongs.length > 0 && (
              <PreviousSongs previousSongs={room.gameState.previousSongs} />
            )}
          </>
        )}
      </Flex>
      <div>
        <Text color="ruby" weight="bold">
          {guessResponse}
        </Text>
        <TextField.Root style={{ marginTop: 8 }}>
          <TextField.Input
            value={guess}
            onChange={(e) => {
              if (room.gameState.type !== "playing") return;
              setGuess(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && guess) {
                processGuess(guess);
                setGuess("");
              }
            }}
            placeholder="Guess the song or artist!"
          />
        </TextField.Root>
        <progress value={progress} max="100" style={{ width: "100%" }} />
      </div>
      <div>
        Volume
        <Slider
          value={[volume]}
          min={0}
          max={100}
          onValueChange={(v) => changeVolume(v[0])}
          onValueCommit={(v) => {
            store.dispatch(userSlice.actions.setVolume(v[0]));
          }}
        />
      </div>
    </Flex>
  );
};

export default Game;
