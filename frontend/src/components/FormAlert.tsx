import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Erreur d'un formulaire, affichée dans le formulaire (près du bouton), jamais dans un toast qui
 * disparaît : critères WCAG 3.3.1 et 3.3.3 (rapport 05, P3a). `role="alert"` la fait lire aussitôt.
 */
export function FormAlert({ message, children, className }: { message?: string | null; children?: ReactNode; className?: string }) {
  if (!message && !children) return null;
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", className)}
    >
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" aria-hidden="true" />
      <div className="min-w-0 space-y-1">
        {message && <p>{message}</p>}
        {children}
      </div>
    </div>
  );
}

export default FormAlert;
