import { useState } from "react";
import "./App.css";
import Lobby from "./Lobby";
import { store, useAppSelector, userSlice } from "./store";
import Room from "./Room";
import Create from "./Create";
import { Button, Flex, Heading, TextFieldInput } from "@radix-ui/themes";

function App() {
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const username = useAppSelector((state) => state.user.name);
  const inRoom = useAppSelector((state) => state.room.room);
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
    </Flex>
  );
}

export default App;
