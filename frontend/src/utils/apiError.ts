import axios from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * Traduit une erreur d'appel à l'API en message pour l'utilisateur (rapport 05, itération P3a).
 *
 * Le backend renvoie un ApiError : `message` (phrase pour l'utilisateur), `code` stable (ApiErrorCode)
 * et `fieldErrors` (message par champ). Nginx, lui, répond en HTML (429, 413, 502, 504) : on se fie
 * alors au code HTTP. Un message du serveur n'est affiché que pour une erreur 4xx, ou une 500 au
 * nouveau contrat (code INTERNAL_ERROR, qui ne contient qu'une référence) : les anciennes réponses 500
 * contenaient le texte technique de l'exception.
 */

export interface UserError {
  /** Code HTTP, ou 0 si le serveur n'a pas répondu. */
  status: number;
  /** Code stable du backend (EMAIL_ALREADY_USED…), absent si la réponse ne vient pas de l'API. */
  code?: string;
  /** Phrase à afficher. */
  message: string;
  /** Message par champ, renvoyé par la validation du serveur. */
  fieldErrors: Record<string, string>;
}

export const ERROR_MESSAGES = {
  network: "Connexion impossible. Vérifiez votre connexion Internet, puis réessayez.",
  timeout: "Le serveur met trop de temps à répondre. Réessayez dans quelques instants.",
  unavailable: "Le service est momentanément indisponible. Réessayez dans quelques minutes.",
  tooMany: "Trop de tentatives. Patientez une minute avant de réessayer.",
  fileTooLarge: "Fichier trop volumineux (10 Mo au maximum).",
  forbidden: "Vous n'avez pas l'autorisation d'effectuer cette action.",
  session: "Votre session a expiré. Reconnectez-vous, puis réessayez.",
  generic: "Une erreur est survenue. Réessayez dans quelques instants.",
  invalidCredentials: "E-mail ou mot de passe incorrect.",
  emailAlreadyUsed: "Cet e-mail est déjà utilisé.",
} as const;

interface ApiErrorBody {
  code?: unknown;
  message?: unknown;
  fieldErrors?: unknown;
}

export function toUserError(error: unknown): UserError {
  if (!axios.isAxiosError(error)) {
    return { status: 0, message: ERROR_MESSAGES.generic, fieldErrors: {} };
  }
  const response = error.response;
  if (!response) {
    const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    return { status: 0, message: timedOut ? ERROR_MESSAGES.timeout : ERROR_MESSAGES.network, fieldErrors: {} };
  }

  const status = response.status;
  const body: ApiErrorBody = response.data && typeof response.data === "object" ? response.data : {};
  const code = typeof body.code === "string" ? body.code : undefined;
  const serverMessage = typeof body.message === "string" && body.message.trim() ? body.message.trim() : undefined;
  const fieldErrors =
    body.fieldErrors && typeof body.fieldErrors === "object" ? (body.fieldErrors as Record<string, string>) : {};

  let message: string;
  if (status === 429) message = ERROR_MESSAGES.tooMany;
  else if (status === 413) message = ERROR_MESSAGES.fileTooLarge;
  else if (status >= 500) message = code === "INTERNAL_ERROR" && serverMessage ? serverMessage : ERROR_MESSAGES.unavailable;
  else if (status === 401) message = ERROR_MESSAGES.session;
  else if (status === 403) message = code && serverMessage ? serverMessage : ERROR_MESSAGES.forbidden;
  else message = serverMessage ?? ERROR_MESSAGES.generic;

  return { status, code, message, fieldErrors };
}

/** Erreur constatée dans la page avant tout envoi (ex. mots de passe différents), même forme qu'une erreur de l'API. */
export const clientError = (message: string): UserError => ({ status: 0, message, fieldErrors: {} });

/** Message seul, pour un toast ou un encadré. */
export const userMessage = (error: unknown) => toUserError(error).message;

/**
 * Messages par champ, sans doublon : pour un formulaire qui ne les place pas sous ses champs
 * (formulaires de l'administration). Un formulaire react-hook-form utilise `applyFieldErrors`.
 */
export const fieldErrorMessages = (e: UserError): string[] => [...new Set(Object.values(e.fieldErrors))];

/** Morceau de page chargé à la demande introuvable : l'ancienne version du site après un déploiement. */
export const isChunkLoadError = (error: unknown): boolean =>
  error instanceof Error &&
  /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk .* failed/i.test(
    `${error.name} ${error.message}`,
  );

/** Un compte existe déjà avec cet e-mail (code du backend, ou ancien message 409 avant backend-v1.6). */
export const isEmailAlreadyUsed = (e: UserError) =>
  e.code === "EMAIL_ALREADY_USED" || (e.status === 409 && !e.code && /existe déjà/i.test(e.message));

/**
 * Place sous chaque champ connu du formulaire le message renvoyé par le serveur.
 * Retourne true si au moins un champ a été signalé (le premier reçoit le focus).
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string>,
  knownFields: readonly Path<T>[],
): boolean {
  let first = true;
  for (const field of knownFields) {
    const text = fieldErrors[field];
    if (!text) continue;
    setError(field, { type: "server", message: text }, { shouldFocus: first });
    first = false;
  }
  return !first;
}
