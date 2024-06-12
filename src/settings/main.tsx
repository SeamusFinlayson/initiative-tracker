import React from "react";
import ReactDOM from "react-dom/client";
import ThemeProvider from "@mui/material/styles/ThemeProvider";

import { App } from "./App";
import { PluginGate } from "../PluginGate";
import { PluginThemeProvider } from "../PluginThemeProvider";
import Settings from "./Settings";

import "../index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PluginGate>
      <PluginThemeProvider>
        <Settings></Settings>
      </PluginThemeProvider>
    </PluginGate>
  </React.StrictMode>
);
