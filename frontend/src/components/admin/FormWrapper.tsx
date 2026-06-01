import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface FormWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  // Ancienne API (UserForm, BourseForm, ArticleForm, ConcoursForm, FiliereForm, GalerieForm, PosteForm)
  backUrl?: string;
  isLoading?: boolean;
  // Nouvelle API (MembreForm, PartenaireForm, UniversiteForm, LienUtileForm, RessourceForm)
  backPath?: string;
  onSubmit?: (e: React.FormEvent) => Promise<void> | void;
  isSubmitting?: boolean;
}

const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  subtitle,
  children,
  backUrl,
  isLoading = false,
  backPath,
  onSubmit,
  isSubmitting = false,
}) => {
  const navigate = useNavigate();
  const resolvedBackPath = backUrl || backPath || "/admin";
  const isPending = isLoading || isSubmitting;

  const content = (
    <div className="max-w-4xl mx-auto">
      {/* Lien retour */}
      <div className="mb-5">
        <Link
          to={resolvedBackPath}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-amame-muted hover:text-amame-charcoal transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Retour à la liste
        </Link>
      </div>

      {/* Carte formulaire */}
      <div className="bg-white rounded-xl border border-amame-border shadow-card overflow-hidden">
        {/* En-tête */}
        <div className="px-6 py-5 border-b border-amame-border">
          <h1 className="font-nunito font-bold text-xl text-amame-charcoal">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-amame-muted">{subtitle}</p>}
        </div>

        {/* Corps */}
        {isPending && !onSubmit ? (
          <div className="p-6 animate-pulse space-y-4">
            <div className="h-4 bg-gray-100 rounded-lg w-3/4" />
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        ) : (
          <div className="px-6 py-6">{children}</div>
        )}

        {/* Boutons d'action — nouvelle API uniquement */}
        {onSubmit && (
          <div className="px-6 py-4 border-t border-amame-border flex justify-end items-center gap-3 bg-gray-50/60">
            <button
              type="button"
              onClick={() => navigate(resolvedBackPath)}
              className="py-2 px-4 border border-amame-border rounded-xl text-sm font-semibold text-amame-slate hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="admin-form"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-5 border border-transparent rounded-xl text-sm font-semibold text-white bg-amame-green hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amame-green disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? "Sauvegarde en cours..."
                : title.startsWith("Modifier")
                  ? "Mettre à jour"
                  : "Enregistrer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (onSubmit) {
    return (
      <form id="admin-form" onSubmit={onSubmit}>
        {content}
      </form>
    );
  }

  return content;
};

export default FormWrapper;
