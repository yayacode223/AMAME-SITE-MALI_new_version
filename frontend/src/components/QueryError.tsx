import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toUserError } from "@/utils/apiError";

interface QueryErrorProps {
  /** Erreur du chargement (React Query `error`). */
  error: unknown;
  /** Relance le chargement (React Query `refetch`). Sans elle, pas de bouton. */
  onRetry?: () => unknown;
  /** Chargement relancé en cours (React Query `isFetching`). */
  isRetrying?: boolean;
  /** Ce qui n'a pas pu être chargé, en une phrase. */
  title?: string;
  className?: string;
}

/**
 * Chargement impossible (liste, fiche, statistiques) : dit pourquoi et propose de réessayer, au lieu
 * d'une liste vide trompeuse (« Aucune donnée ») ou d'un formulaire vide (rapport 05, P3b).
 * Pas de bouton « Réessayer » pour un refus de droits (403) : réessayer n'y changerait rien.
 */
export function QueryError({ error, onRetry, isRetrying = false, title = "Le contenu n'a pas pu être chargé.", className }: QueryErrorProps) {
  const { status, message } = toUserError(error);
  const canRetry = !!onRetry && status !== 403;
  return (
    <div
      role="alert"
      className={cn("flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-800 sm:flex-row sm:items-center", className)}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5">{message}</p>
        </div>
      </div>
      {canRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          disabled={isRetrying}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-red-300 bg-white px-4 py-2 font-semibold text-red-800 transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-60 sm:self-center"
        >
          <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} aria-hidden="true" />
          {isRetrying ? "Chargement…" : "Réessayer"}
        </button>
      )}
    </div>
  );
}

export default QueryError;
