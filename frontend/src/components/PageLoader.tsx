import { useLayoutEffect, useRef, useState } from "react";

/**
 * Chargement d'une page (docs/06, R11) : logo AMAME dans une roue. Mêmes classes et même balisage que
 * le chargement écrit dans index.html, qui s'affiche avant le script ; leurs styles sont dans index.html.
 *
 * - `page` : plein écran, sous la barre du bas (fallback de Suspense, garde de connexion) ;
 * - `section` : dans le contenu des espaces admin et membre, le menu reste affiché.
 *
 * Entre deux pages, le logo n'apparaît qu'après 200 ms : une page déjà en cache ne le fait pas clignoter.
 * Un chargement qui en remplace un autre (celui de index.html, celui de la garde) s'affiche tout de
 * suite, et sa roue reprend la phase de la précédente : l'arc ne saute pas au changement.
 */

/** Chargement de index.html, à l'écran jusqu'au premier rendu de React. */
const BOOT_ID = "amame-boot-loader";

const ringAnimation = (ring: Element | null) => ring?.getAnimations?.()[0];

/** Départ commun de toutes les roues : celui de la roue de index.html, lu avant que React ne la remplace. */
let spinStart: CSSNumberish | null = (() => {
  const anim = ringAnimation(document.querySelector(`#${BOOT_ID} .amame-loader-ring`));
  if (!anim) return null;
  if (anim.startTime == null) anim.startTime = document.timeline.currentTime;
  return anim.startTime;
})();

let onScreen = 0;
let lastHiddenAt = -Infinity;

/** Un autre chargement est (ou était à l'instant) à l'écran : celui-ci le remplace. */
const takesOver = () =>
  document.getElementById(BOOT_ID) !== null || onScreen > 0 || performance.now() - lastHiddenAt < 100;

type PageLoaderProps = {
  variant?: "page" | "section";
};

const PageLoader = ({ variant = "page" }: PageLoaderProps) => {
  const [immediate] = useState(takesOver);
  const ring = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    onScreen++;
    const anim = ringAnimation(ring.current);
    if (anim) {
      if (spinStart == null) spinStart = anim.startTime ?? document.timeline.currentTime;
      else anim.startTime = spinStart;
    }
    return () => {
      onScreen--;
      lastHiddenAt = performance.now();
    };
  }, []);

  const classes = ["amame-loader", variant === "section" && "amame-loader-section", !immediate && "amame-loader-delayed"];
  return (
    <div className={classes.filter(Boolean).join(" ")} role="status">
      <div className="amame-loader-mark" aria-hidden="true">
        <div ref={ring} className="amame-loader-ring" />
        <div className="amame-loader-logo">
          <img src="/logo-192.webp" alt="" width={74} height={74} />
        </div>
      </div>
      <span className="amame-loader-sr">Chargement de la page…</span>
    </div>
  );
};

export default PageLoader;
