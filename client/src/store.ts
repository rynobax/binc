import { createSlice, configureStore, PayloadAction } from "@reduxjs/toolkit";
import { Lobby } from "../../shared/shared";
import { useDispatch, TypedUseSelectorHook, useSelector } from "react-redux";

export const lobbySlice = createSlice({
  name: "lobby",
  initialState: {
    rooms: [],
  } as Lobby,
  reducers: {
    updateLobby(state, action: PayloadAction<Lobby>) {
      state = action.payload;
    },
  },
});

export const store = configureStore({
  reducer: {
    lobby: lobbySlice.reducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
