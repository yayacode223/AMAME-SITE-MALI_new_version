import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext.tsx";
import { queryClient } from "@/lib/queryClient";
import { purgePrivateCaches } from "@/utils/privateCaches";
import { watchForAppUpdate } from "@/utils/appUpdate";

// Supprime l'ancien cache de l'API, qui gardait des réponses privées (écart E44).
void purgePrivateCaches();

// Après un déploiement, passe à la nouvelle version sans perdre de saisie (rapport 05, D9).
watchForAppUpdate();

const rootElement = document.getElementById("root")!;
const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <HelmetProvider> 
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider> 
  </React.StrictMode>
);
