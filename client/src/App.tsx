import "./App.css";
import { connect } from "./websocket";

function App() {
  return (
    <>
      <h1>binc</h1>
      <div>
        <button onClick={connect}>Create Room</button>
      </div>
    </>
  );
}

export default App;
