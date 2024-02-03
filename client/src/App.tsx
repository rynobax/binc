import "./App.css";
import { startRoom } from "./websocket";

function App() {
  return (
    <>
      <h1>binc</h1>
      <div>
        <button onClick={startRoom}>Create Room</button>
      </div>
    </>
  );
}

export default App;
