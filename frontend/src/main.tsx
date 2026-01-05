import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import "./index.css";
import App from "./App.tsx";

// Initialisation des éléments PWA (pour la caméra dans le navigateur/webview)
defineCustomElements(window);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
