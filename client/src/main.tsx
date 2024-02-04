import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Theme } from "@radix-ui/themes";
import { store } from "./store";
import App from "./App.tsx";
import "./index.css";
import "@radix-ui/themes/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <Theme>
        <App />
      </Theme>
    </Provider>
  </React.StrictMode>
);
