import React, { useEffect, useState } from "react";
import { store, useAppSelector, userSlice } from "./store";
import {
  ClientRoom,
  GameState,
  ROUND_LENGTH_SEC,
  TIME_BETWEEN_ROUNDS_SEC,
} from "../../shared/shared";
import { submitCorrectGuess } from "./websocket";
import { incorrectMessages } from "./data";
import { Badge, Flex, Slider, Text, TextField } from "@radix-ui/themes";
import PreviousSongs from "./PreviousSongs";
import { isGuessCorrect } from "./guess";
import { YTPlayer } from "./ytPlayer";

function timeSinceGameStart(gameState: GameState, time: number) {
  if (gameState.type === "paused") return "";
  if (time === 0) return "";
  const { roundStartTime } = gameState;
  const seconds = (time - roundStartTime) / 1000;
  const secondsStr = seconds.toFixed(1);
  return ` (${secondsStr}s)`;
}

// TODO: not great
const VIDEO_START_SEC = 30;
const DEFAULT_VOLUME = 30;

const UPDATE_INTERVAL_MS = 100;
const PROGRESS_BACKWARDS_UPDATE =
  100 / ((TIME_BETWEEN_ROUNDS_SEC * 1000) / UPDATE_INTERVAL_MS);

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

  useEffect(function destroyOnUnmount() {
    return () => {
      YTPlayer().pauseVideo();
    };
  }, []);

  useEffect(() => {
    if (room.gameState.type === "paused") {
      setGuess("");
    }
  }, [room.gameState.type]);

  useEffect(() => {
    console.log(room.gameState.type);
    if (room.gameState.type === "paused") {
      YTPlayer().pauseVideo();
      return;
    }

    // TODO: cue
    if (room.gameState.type === "queued") {
      YTPlayer().pauseVideo();
      return;
    }

    const currentSongId = room.gameState.currentSong?.id;
    async function doStuff() {
      if (!currentSongId) return;
      const url = "";
      console.log({ currentSongId, url });
      if (currentSongId && YTPlayer().currentVideoId() !== currentSongId) {
        YTPlayer().loadVideoById(currentSongId, VIDEO_START_SEC);
      }
    }

    doStuff().catch(console.error);
  }, [room.gameState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = store.getState().room.room?.gameState;
      if (!state || state.type === "paused" || state.type === "queued") {
        setProgress((prevProg) => {
          return Math.max(0, prevProg - PROGRESS_BACKWARDS_UPDATE);
        });
      } else {
        const audioDuration = ROUND_LENGTH_SEC;
        const audioCurrentTime = YTPlayer().currentTime() - VIDEO_START_SEC;
        console.log({ audioDuration, audioCurrentTime });
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
    YTPlayer().setVolume(newVolume);
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
                        style={{ minWidth: 88, textAlign: "center" }}
                      >
                        song
                        {timeSinceGameStart(room.gameState, user.guesses.title)}
                      </Badge>
                      <Badge
                        color={user.guesses.artist ? "green" : "gray"}
                        variant={user.guesses.artist ? "solid" : "soft"}
                        style={{ minWidth: 88, textAlign: "center" }}
                      >
                        artist
                        {timeSinceGameStart(
                          room.gameState,
                          user.guesses.artist
                        )}
                      </Badge>
                      <Text weight="bold">{user.name} </Text>
                      <Text>({user.score})</Text>
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
