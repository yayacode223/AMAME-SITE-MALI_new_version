import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "@/context/AuthContext.tsx";
const queryClient = new QueryClient();

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
