import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";
import { ClientRoom, Lobby } from "../../shared/shared";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";
import { resetTokenOnExpiration } from "./login";

const STATE_VERSION = String(1);

interface User {
  name: string;
  spotifyToken?: {
    token: string;
    expiresAt: number;
  };
  volume?: number;
}

export const userSlice = createSlice({
  name: "user",
  initialState: {
    name: "",
  } as User,
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setSpotifyToken(state, action: PayloadAction<User["spotifyToken"]>) {
      state.spotifyToken = action.payload;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload;
    },
  },
});

export const lobbySlice = createSlice({
  name: "lobby",
  initialState: {
    lobby: { rooms: [] },
  } as { lobby: Lobby },
  reducers: {
    setLobby(state, action: PayloadAction<Lobby>) {
      console.log({ action });
      state.lobby = action.payload;
    },
  },
});

export const roomSlice = createSlice({
  name: "room",
  initialState: {
    room: null,
  } as { room: ClientRoom | null },
  reducers: {
    setRoom(state, action: PayloadAction<ClientRoom | null>) {
      state.room = action.payload;
    },
  },
});

const preloadedState = ((): unknown => {
  const state = localStorage.getItem("state");
  if (!state) return {};
  const { version, ...rest } = JSON.parse(state);
  if (version !== STATE_VERSION) return {};
  const userTokenIsExpired =
    rest.user.spotifyToken?.expiresAt < Date.now() + 1000 * 60 * 5;
  if (userTokenIsExpired) {
    rest.user.spotifyToken = undefined;
  }
  if (rest.user.spotifyToken) {
    resetTokenOnExpiration(rest.user.spotifyToken.expiresAt);
  }
  return rest;
})();

export const store = configureStore({
  reducer: {
    lobby: lobbySlice.reducer,
    user: userSlice.reducer,
    room: roomSlice.reducer,
  },
  preloadedState,
});

let lastUser: User | null = null;
setInterval(() => {
  const currentState = store.getState().user;
  if (lastUser === currentState) return;
  lastUser = currentState;
  const stateToSave: Partial<RootState> & { version: string } = {
    version: STATE_VERSION,
    user: store.getState().user,
  };
  localStorage.setItem("state", JSON.stringify(stateToSave));
}, 10000);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).store = store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
