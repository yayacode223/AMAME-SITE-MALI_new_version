import { Component, ErrorInfo, ReactNode, createRef } from "react";
import { AlertTriangle, Home, RotateCw } from "lucide-react";
import { isChunkLoadError } from "@/utils/apiError";
import { reloadOnce } from "@/utils/appUpdate";

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * Change à chaque page (pathname) : l'erreur est oubliée quand on change de page, sans remonter
   * tout l'arbre à chaque navigation.
   */
  resetKey?: unknown;
  /**
   * "page" : remplace tout l'écran (dernier recours, App.tsx).
   * "section" : remplace seulement le contenu, le menu de l'espace admin ou membre reste utilisable.
   */
  variant?: "page" | "section";
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Une erreur d'affichage (donnée de forme inattendue, bug) donnait une page blanche : on affiche à la
 * place « Un problème est survenu » avec de quoi repartir (rapport 05, P3b). Un morceau de page de
 * l'ancienne version introuvable après un déploiement recharge la page une fois (D9).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };
  private headingRef = createRef<HTMLHeadingElement>();

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erreur d'affichage", error, info.componentStack);
    if (isChunkLoadError(error)) reloadOnce();
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
      return;
    }
    // Le message remplace la page : le lecteur d'écran et le clavier partent de son titre.
    if (this.state.error && !prevState.error) this.headingRef.current?.focus();
  }

  render() {
    if (!this.state.error) return this.props.children;

    const isPage = (this.props.variant ?? "page") === "page";
    const content = (
      <div className="w-full max-w-md rounded-2xl border border-amame-border bg-white p-6 text-center shadow-sm sm:p-8">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
          <AlertTriangle className="h-6 w-6 text-amber-700" aria-hidden="true" />
        </div>
        <h1
          ref={this.headingRef}
          tabIndex={-1}
          className="font-nunito text-xl font-bold text-amame-charcoal focus:outline-none"
        >
          Un problème est survenu
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-amame-slate">
          {/* Espace insécable avant « ; » : jamais de « ; » en début de ligne. */}
          Cette page n'a pas pu s'afficher. Rechargez-la{" "};
          {isPage ? " si le problème continue, revenez à l'accueil." : " vous pouvez aussi choisir une autre rubrique dans le menu."}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amame-green px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amame-green-dark focus:outline-none focus:ring-2 focus:ring-amame-green focus:ring-offset-2"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" />
            Recharger la page
          </button>
          {isPage && (
            // Lien ordinaire, pas <Link> : repartir d'une page entièrement neuve.
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amame-border px-5 py-2.5 text-sm font-semibold text-amame-slate transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amame-green focus:ring-offset-2"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Retour à l'accueil
            </a>
          )}
        </div>
      </div>
    );

    return isPage ? (
      <main className="flex min-h-screen items-center justify-center bg-amame-surface px-4 py-10">{content}</main>
    ) : (
      <div className="flex justify-center py-10">{content}</div>
    );
  }
}

export default ErrorBoundary;
