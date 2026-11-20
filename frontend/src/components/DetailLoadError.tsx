import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import QueryError from "@/components/QueryError";

interface DetailLoadErrorProps {
  /** Erreur du chargement de la fiche (React Query `error`). */
  error: unknown;
  /** Relance le chargement (React Query `refetch`). */
  onRetry: () => unknown;
  /** Chargement relancé en cours (React Query `isFetching`). */
  isRetrying?: boolean;
  /** Ce qui n'a pas pu être chargé, en une phrase : « Cette bourse n'a pas pu être chargée. » */
  title: string;
  /** Liste à laquelle revenir. */
  backTo: string;
  backLabel: string;
}

/**
 * Fiche publique dont le chargement a échoué pour une autre raison que « introuvable » (serveur en
 * panne, réseau coupé) : la raison traduite, « Réessayer » et le retour à la liste (docs/06, R2).
 * Une fiche introuvable (404, ou adresse sans identifiant valable) garde l'écran « … non trouvé » de
 * sa page : réessayer n'y changerait rien.
 */
export function DetailLoadError({ error, onRetry, isRetrying = false, title, backTo, backLabel }: DetailLoadErrorProps) {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 text-left">
      <QueryError error={error} onRetry={onRetry} isRetrying={isRetrying} title={title} />
      <div className="flex justify-center">
        <Button asChild variant="outline" className="gap-2 rounded-xl border-amame-border">
          <Link to={backTo}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Link>
        </Button>
      </div>
    </div>
  );
}

export default DetailLoadError;
