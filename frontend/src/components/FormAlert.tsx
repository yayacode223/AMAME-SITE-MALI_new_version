import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldErrorMessages, type UserError } from "@/utils/apiError";

interface FormAlertProps {
  /** Phrase seule (formulaire qui place lui-même les erreurs sous ses champs). */
  message?: string | null;
  /**
   * Erreur complète : sa phrase, puis la liste des messages par champ. Pour un formulaire qui ne les
   * affiche pas sous ses champs (administration).
   */
  error?: UserError | null;
  children?: ReactNode;
  className?: string;
}

/**
 * Erreur d'un formulaire, affichée dans le formulaire (près du bouton), jamais dans un toast qui
 * disparaît : critères WCAG 3.3.1 et 3.3.3 (rapport 05, P3a). `role="alert"` la fait lire aussitôt.
 */
export function FormAlert({ message, error, children, className }: FormAlertProps) {
  const text = message ?? error?.message;
  const details = error ? fieldErrorMessages(error) : [];
  if (!text && details.length === 0 && !children) return null;
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", className)}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {text && <p>{text}</p>}
        {details.length > 0 && (
          <ul className="list-disc pl-4 space-y-0.5">
            {details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
        {children}
      </div>
    </div>
  );
}

export default FormAlert;
