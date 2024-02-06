import React, { useEffect, useRef, useState } from "react";
import levy from "js-levenshtein";
import { store, useAppSelector, userSlice } from "./store";
import { ClientRoom, GameState } from "../../shared/shared";
import { submitCorrectGuess } from "./websocket";
import { incorrectMessages } from "./data";
import { Badge, Flex, Slider, Text, TextField } from "@radix-ui/themes";
import { remapToLogScale } from "./util";
import PreviousSongs from "./PreviousSongs";

function doStringsMatch(target: string, guess: string) {
  if (target.length < 4)
    return target.toLocaleLowerCase() === guess.toLocaleLowerCase();
  const distance = levy(target.toLocaleLowerCase(), guess.toLocaleLowerCase());
  return distance <= 3;
}

function timeSinceGameStart(gameState: GameState, time: number) {
  if (gameState.type === "paused") return "";
  if (time === 0) return "";
  const { roundStartTime } = gameState;
  const seconds = (time - roundStartTime) / 1000;
  const secondsStr = seconds.toFixed(1);
  return ` (${secondsStr}s)`;
}

const DEFAULT_VOLUME = 30;

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
    }, 100);
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
                      >
                        song
                        {timeSinceGameStart(room.gameState, user.guesses.title)}
                      </Badge>
                      <Badge
                        color={user.guesses.artist ? "green" : "gray"}
                        variant={user.guesses.artist ? "solid" : "soft"}
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
