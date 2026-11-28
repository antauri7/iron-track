import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ScrollToTop } from "./navigation";
import "./style.css";
import { configureTouchViewport } from "./mobile";
configureTouchViewport();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <ScrollToTop />
      <App />
    </HashRouter>
  </React.StrictMode>,
);
