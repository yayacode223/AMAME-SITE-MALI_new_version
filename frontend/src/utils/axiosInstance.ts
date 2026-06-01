import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export const Api = axios.create({
  baseURL: "/api",
  withCredentials: true, // indispensable pour l'envoi automatique des cookies HttpOnly
});

// ── Intercepteur requête ─────────────────────────────────────────────────────
Api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => config,
  (error) => Promise.reject(error),
);

// ── Gestion du refresh token ─────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v?: unknown) => void; reject: (r?: unknown) => void }> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  failedQueue = [];
};

/** Endpoints pour lesquels on ne tente PAS de refresh (évite les boucles infinies). */
const isAuthEndpoint = (url?: string) =>
  !!url && (
    url.includes("/auth/refresh") ||
    url.includes("/auth/login") ||
    url.includes("/auth/logout") ||
    url.includes("/visitor/register")
  );

// ── Intercepteur réponse ─────────────────────────────────────────────────────
Api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthEndpoint(original.url)
    ) {
      // Refresh déjà en cours → mettre la requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => Api(original))
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        // Le backend valide le cookie refresh_token, le rotate et pose de nouveaux cookies
        await Api.post("/auth/refresh");
        processQueue(null);       // Débloquer les requêtes en attente
        return Api(original);     // Rejouer la requête originale
      } catch (refreshError) {
        processQueue(refreshError); // Rejeter les requêtes en attente
        // Ne pas faire window.location.href ici : ProtectedRoute gère la redirection
        // via React Router (sans rechargement), évitant la boucle infinie.
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);