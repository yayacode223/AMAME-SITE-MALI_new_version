import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onConfirm,
  onClose,
  title = "Confirmer la suppression",
  description = "Cette action est irréversible et ne peut pas être annulée.",
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  variant = "danger",
  isLoading = false,
}) => {
  const isDanger = variant === "danger";

  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-md rounded-2xl border border-amame-border p-0 overflow-hidden shadow-card-hover">
        {/* Corps */}
        <div className="px-6 pt-6 pb-2">
          <AlertDialogHeader className="gap-0">
            {/* Icône */}
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${isDanger ? "bg-red-50" : "bg-amame-gold-subtle"}`}>
              {isDanger
                ? <TrashIcon className="h-5 w-5 text-red-500" />
                : <ExclamationTriangleIcon className="h-5 w-5 text-amame-gold" />
              }
            </div>

            <AlertDialogTitle className="font-nunito font-bold text-base text-amame-charcoal text-left">
              {title}
            </AlertDialogTitle>

            {description && (
              <AlertDialogDescription className="text-sm text-amame-muted leading-relaxed mt-1.5 text-left">
                {description}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
        </div>

        {/* Footer */}
        <AlertDialogFooter className="px-6 py-4 bg-gray-50/70 border-t border-amame-border gap-2 sm:gap-2 flex-row sm:flex-row sm:justify-end">
          <AlertDialogCancel
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 sm:flex-none rounded-xl border-amame-border text-amame-slate text-sm font-semibold hover:bg-gray-100 transition-colors h-9"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); onConfirm(); }}
            disabled={isLoading}
            className={`flex-1 sm:flex-none rounded-xl text-sm font-semibold h-9 transition-colors border border-transparent ${
              isDanger
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-amame-gold hover:bg-amber-600 text-white"
            } disabled:opacity-60`}
          >
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                {confirmLabel}...
              </span>
            ) : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDialog;
