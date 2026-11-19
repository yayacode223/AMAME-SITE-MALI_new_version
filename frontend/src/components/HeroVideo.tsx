import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import StaticImage from "@/components/StaticImage";
import heroLandscape from "@/assets/video/hero-16x9.mp4";
import heroPortrait from "@/assets/video/hero-4x5.mp4";

/*
 * Fond vidéo du hero de l'accueil (fichiers produits par scripts/encode_hero_video.py).
 *
 * Le poster s'affiche d'abord : c'est l'image principale de la page (LCP). La vidéo n'est demandée
 * qu'une fois le poster et la page chargés, quand le navigateur est libre, et seulement si elle est
 * permise (videoAllowed). Elle apparaît en fondu dès sa première image : le poster, identique à
 * cette image, reste dessous, sans saut ni flash noir. Elle est décorative (sans son, aria-hidden),
 * mais animée plus de 5 s : un bouton permet de l'arrêter (WCAG 2.2.2).
 */

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string };

/**
 * Vidéo permise : visiteur en ligne, sans demande de réduction des animations ni d'économie de
 * données, connexion évaluée en 4G. Seuls Chrome et ses dérivés exposent la qualité de connexion :
 * Safari et Firefox chargent la vidéo, sauf réduction des animations.
 */
const videoAllowed = (): boolean => {
  if (!navigator.onLine) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  if (connection?.saveData) return false;
  return !["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
};

/** Lance `callback` une fois la page chargée, quand le navigateur est libre. Renvoie l'annulation. */
const whenPageIdle = (callback: () => void): (() => void) => {
  let idleHandle: number | undefined;
  let timer: number | undefined;
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(callback, { timeout: 2000 });
    } else {
      timer = window.setTimeout(callback, 1000); // Safari : pas de requestIdleCallback
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
  return () => {
    window.removeEventListener("load", schedule);
    if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
    if (timer !== undefined) window.clearTimeout(timer);
  };
};

const HeroVideo = () => {
  const [posterSettled, setPosterSettled] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false); // première image affichée : la vidéo couvre le poster
  const [paused, setPaused] = useState(false); // pause demandée par le visiteur
  const layerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Choix de la vidéo, après le poster et la page : elle ne retarde ni l'un ni l'autre.
  //    Portrait (mobiles) : version 4:5 recadrée sur les visages, plus légère ; sinon 16:9.
  useEffect(() => {
    if (!posterSettled) return;
    return whenPageIdle(() => {
      if (!videoAllowed()) return;
      setSrc(window.matchMedia("(orientation: portrait)").matches ? heroPortrait : heroLandscape);
    });
  }, [posterSettled]);

  // 2. Lecture tant que le hero est à l'écran, que l'onglet est visible et que le visiteur n'a pas
  //    mis en pause : ailleurs, la vidéo ne consomme ni processeur ni batterie.
  useEffect(() => {
    const video = videoRef.current;
    const layer = layerRef.current;
    if (!src || !video || !layer) return;
    // Propriétés plutôt qu'attributs : React ne pose pas l'attribut muted (exigé par iOS pour lire
    // sans geste), et ses types ne connaissent pas les deux suivantes.
    video.muted = true;
    video.disablePictureInPicture = true;
    video.disableRemotePlayback = true; // pas de bouton « Caster » sur Chrome Android
    let onScreen = true;
    const sync = () => {
      if (onScreen && !document.hidden && !paused) {
        // Refus possible (mode économie d'énergie d'iOS, codec absent…) : le poster reste affiché.
        video.play().catch(() => undefined);
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      sync();
    });
    observer.observe(layer);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [src, paused]);

  const label = paused ? "Lire la vidéo" : "Mettre la vidéo en pause";

  return (
    <>
      <div ref={layerRef} className="absolute inset-0" aria-hidden="true">
        <StaticImage
          name="home/hero-poster"
          sizes="100vw"
          priority
          alt=""
          className="h-full w-full object-cover"
          onLoad={() => setPosterSettled(true)}
          onError={() => setPosterSettled(true)}
        />
        {src && (
          <video
            ref={videoRef}
            src={src}
            muted
            loop
            playsInline
            preload="auto"
            tabIndex={-1}
            onPlaying={() => setPlaying(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
              playing ? "opacity-100" : "opacity-0"
            }`}
          />
        )}
      </div>

      {/* Bouton Pause / Lecture, aligné sur la colonne de la page : en haut sur mobile (le bas du
          hero passe sous la barre de navigation), en bas sur desktop. */}
      {playing && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 lg:top-auto lg:bottom-6">
          <div className="page-container flex justify-end">
            <button
              type="button"
              onClick={() => setPaused((value) => !value)}
              aria-label={label}
              title={label}
              className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {paused ? <Play className="h-5 w-5" aria-hidden="true" /> : <Pause className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HeroVideo;
