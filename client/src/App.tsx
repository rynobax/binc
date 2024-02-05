import { useEffect, useRef, useState } from "react";
import Lobby from "./Lobby";
import { store, useAppSelector, userSlice } from "./store";
import Room from "./Room";
import Create from "./Create";
import { Button, Flex, Heading, TextFieldInput } from "@radix-ui/themes";
import { getAccessToken } from "./login";

async function handleOAuthCallback() {
  console.log(window.location.search);
  const queryParams = Array.from(
    new URLSearchParams(window.location.search).entries()
  );
  for (const [key, value] of queryParams) {
    if (key === "code") {
      getAccessToken(value).then((result) =>
        store.dispatch(userSlice.actions.setSpotifyToken(result))
      );
    }
  }
}

function App() {
  const userName = useAppSelector((state) => state.user.name);
  const [nameConfirmed, setNameConfirmed] = useState(!!userName);
  const username = useAppSelector((state) => state.user.name);
  const inRoom = useAppSelector((state) => state.room.room);

  const handling = useRef(false);
  useEffect(function onPageLoad() {
    if (handling.current) return;
    handling.current = true;
    if (window.location.pathname === "/callback") {
      handleOAuthCallback();
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  if (!nameConfirmed) {
    return (
      <Flex gap="5">
        <TextFieldInput
          value={username}
          onChange={(e) =>
            store.dispatch(userSlice.actions.setName(e.target.value))
          }
        />
        <Button
          color="violet"
          disabled={!username}
          onClick={() => setNameConfirmed(true)}
        >
          Choose Name
        </Button>
      </Flex>
    );
  }

  if (inRoom) return <Room />;

  return (
    <Flex direction="column" gap="5">
      <Heading align="center">binc</Heading>
      <Flex gap="9">
        <Create />
        <Lobby />
      </Flex>
      <Button
        color="violet"
        variant="soft"
        onClick={() => {
          setNameConfirmed(false);
        }}
      >
        Change Name
      </Button>
    </Flex>
  );
}

export default App;
