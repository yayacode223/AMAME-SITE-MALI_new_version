import { Skeleton } from "@/components/ui/skeleton";

/** Hauteurs des zones média de index.css (.amame-card-media, -portrait, -logo) ; none : sans média. */
const MEDIA_HEIGHT = {
  photo: "h-44",
  portrait: "h-56",
  logo: "h-32",
  none: "",
} as const;

type CardSkeletonProps = {
  /** Zone média de la carte attendue. */
  media?: keyof typeof MEDIA_HEIGHT;
  /** Disposition : en colonne, ou en ligne (.amame-card-row, média à gauche dès 640 px). */
  layout?: "column" | "row";
  /** Lignes de texte sous le titre. */
  lines?: number;
  /** Pied de carte (information à gauche, action à droite). */
  footer?: boolean;
};

/**
 * Squelette d'une carte .amame-card : même rayon, même bordure, même hauteur de média et mêmes
 * marges que la carte, pour que rien ne change de forme quand les données arrivent.
 */
const CardSkeleton = ({ media = "photo", layout = "column", lines = 2, footer = true }: CardSkeletonProps) => {
  const row = layout === "row";
  const body = (
    <>
      <div className="amame-card-body gap-2.5">
        <Skeleton className="h-5 w-3/4 rounded-md" />
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={`h-4 rounded-md ${i === lines - 1 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
      {footer && (
        <div className="amame-card-footer">
          <Skeleton className="h-4 w-24 rounded-md" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
      )}
    </>
  );

  return (
    <div className={`amame-card ${row ? "amame-card-row" : ""}`} aria-hidden="true">
      {media !== "none" && (
        <Skeleton
          className={`${MEDIA_HEIGHT[media]} w-full shrink-0 rounded-none ${row ? "sm:h-auto sm:min-h-[11rem] sm:w-56" : ""}`}
        />
      )}
      {row ? <div className="flex min-w-0 flex-1 flex-col">{body}</div> : body}
    </div>
  );
};

export default CardSkeleton;
