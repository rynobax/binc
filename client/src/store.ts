import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";
import { ClientRoom, Lobby } from "../../shared/shared";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    name: "",
  } as { name: string },
  reducers: {
    setName(state, action: PayloadAction<string>) {
      state.name = action.payload;
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

export const store = configureStore({
  reducer: {
    lobby: lobbySlice.reducer,
    user: userSlice.reducer,
    room: roomSlice.reducer,
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).store = store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
