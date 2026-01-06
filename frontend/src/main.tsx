import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { defineCustomElements } from "@ionic/pwa-elements/loader";
import "./index.css";
import App from "./App.tsx";

import { Capacitor } from "@capacitor/core";

// Initialisation des éléments PWA (pour la caméra dans le navigateur/webview)
defineCustomElements(window);

// Detection de la plateforme pour ajustements CSS
if (Capacitor.getPlatform() === "android") {
  document.body.classList.add("platform-android");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
