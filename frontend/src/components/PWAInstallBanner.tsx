import { Download, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

/**
 * Bannière d'installation PWA branded AMAME.
 * Affichée uniquement sur mobile (< lg) quand le navigateur signale
 * que l'app est installable (événement beforeinstallprompt).
 * Disparaît 7 jours après un refus.
 */
export function PWAInstallBanner() {
  const { canInstall, install, dismiss } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <div
      className="fixed top-0 inset-x-0 z-[60] lg:hidden"
      role="banner"
      aria-label="Installer l'application AMAME"
    >
      <div className="mx-3 mt-3 flex items-center gap-3 rounded-2xl bg-white shadow-[0_4px_24px_rgb(0_0_0/0.12)] border border-gray-100 px-4 py-3">

        {/* Logo */}
        <img
          src="/amame-uploads/amame-logo.webp"
          alt="AMAME"
          className="h-10 w-10 rounded-xl object-cover shrink-0 ring-2 ring-green-100"
        />

        {/* Texte */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight">
            Installer AMAME
          </p>
          <p className="text-xs text-gray-500 leading-snug mt-0.5">
            Accès rapide, fonctionne hors ligne
          </p>
        </div>

        {/* Bouton installer */}
        <button
          type="button"
          onClick={install}
          className="shrink-0 flex items-center gap-1.5 bg-amame-green hover:bg-amame-green-dark text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors shadow-green"
        >
          <Download className="h-3.5 w-3.5" />
          Installer
        </button>

        {/* Bouton fermer */}
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Fermer la bannière d'installation"
        >
          <X className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
}

export default PWAInstallBanner;
