import { Calendar, Clock, GraduationCap, MapPin, Target, ArrowRight, Trophy } from "lucide-react";
import { format, isAfter, isBefore, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ConcoursResponse } from "@/types/concoursType";
import MediaImage from "@/components/MediaImage";
import { mediaUrl } from "@/utils/media";

const NIVEAU_LABELS: Record<string, string> = {
  BACHELIER: "Bachelier",
  LICENCE: "Licence",
  MASTER: "Master",
  DOCTORAT: "Doctorat",
};
const getNiveauLabel = (niveau: string) => NIVEAU_LABELS[niveau] || niveau;

const safeFormat = (date: Date) => {
  try {
    return format(date, "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
};

const ConcoursCardItem = ({
  id,
  nom,
  description,
  pays,
  niveau,
  status,
  dateOuverture,
  dateLimite,
  filePath,
  fileUrl,
  isAvailable,
}: ConcoursResponse) => {
  const now = new Date();
  const ouverture = new Date(dateOuverture);
  const limite = new Date(dateLimite);

  const isUpcoming = isBefore(now, ouverture);
  const expired = isAfter(now, limite);
  const forcedClosed = isAvailable === false;
  const isClosed = expired || forcedClosed;
  const isOpen = !isUpcoming && !isClosed;
  const daysLeft = isOpen ? differenceInDays(limite, now) : 0;
  const isUrgent = isOpen && daysLeft <= 7;

  const statusConfig = isClosed
    ? { label: "Clôturé", dot: "bg-gray-400", text: "text-gray-600" }
    : isUpcoming
      ? { label: "À venir", dot: "bg-blue-500", text: "text-blue-700" }
      : { label: "Ouvert", dot: "bg-amame-green", text: "text-amame-green-dark" };

  const isNational = status === "NATIONAL";
  const imageUrl = mediaUrl(fileUrl ?? filePath);

  return (
    // Carte .amame-card (index.css) ; couleur du domaine : bleu.
    <Link
      to={`/concours/${id}`}
      aria-label={`Voir les détails du concours ${nom}`}
      className="amame-card amame-card-interactive group"
    >
      {/* ── Média : image pleine largeur + badges flottants ── */}
      <div className="amame-card-media">
        {imageUrl ? (
          <MediaImage
            src={imageUrl}
            maxWidth={640}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={nom}
            className={`amame-card-img ${isClosed ? "grayscale" : ""}`}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center">
            <Trophy className="h-12 w-12 text-white/30" />
          </div>
        )}

        {/* Voile pour la lisibilité des badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 pointer-events-none" />

        {/* Statut (haut-gauche) */}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold shadow-sm">
          <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
          <span className={statusConfig.text}>{statusConfig.label}</span>
        </span>

        {/* Type national / international (haut-droite) */}
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-amame-charcoal shadow-sm">
          <Target className="h-3 w-3" />
          {isNational ? "National" : "International"}
        </span>
      </div>

      {/* ── Corps : titre, description, méta ── */}
      <div className="amame-card-body">
        <h3 className="amame-card-title group-hover:text-blue-600">{nom}</h3>

        {description && <p className="amame-card-text mt-2">{description}</p>}

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>{getNiveauLabel(niveau)}</span>
            <span className="text-amame-border">•</span>
            <MapPin className="h-3.5 w-3.5 text-amame-green shrink-0" />
            <span className="truncate">{pays}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <Calendar className="h-3.5 w-3.5 text-amame-gold shrink-0" />
            <span>Ouverture : {safeFormat(ouverture)}</span>
          </div>
          {isOpen && (
            <div className={`flex items-center gap-2 text-xs font-semibold ${isUrgent ? "text-red-600" : "text-blue-600"}`}>
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
              {isUrgent && <span className="font-bold">· Urgent !</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Pied : clôture, action (toute la carte est cliquable) ── */}
      <div className="amame-card-footer">
        <div className="flex items-center gap-1.5 text-xs font-medium text-amame-slate min-w-0">
          <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
          <span className="truncate">Clôture : {safeFormat(limite)}</span>
        </div>
        <span className="amame-card-action text-blue-600 group-hover:gap-1.5">
          Voir le concours <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};

export default ConcoursCardItem;
