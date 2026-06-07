import { Calendar, Clock, GraduationCap, MapPin, Target, ArrowRight, Trophy } from "lucide-react";
import { format, isAfter, isBefore, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ConcoursResponse } from "@/types/concoursType";

const PROD_URL = "https://amame.ml";

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
  const imageUrl = filePath
    ? filePath.startsWith("http")
      ? filePath
      : `${PROD_URL}/${filePath}`
    : null;

  return (
    <Link
      to={`/concours/${id}`}
      aria-label={`Voir les détails du concours ${nom}`}
      className="group h-full flex flex-col bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
    >
      {/* ── Header : image pleine largeur + badges flottants ── */}
      <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-gray-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={nom}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isClosed ? "grayscale" : ""}`}
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

      {/* ── Body : titre, description, méta ── */}
      <div className="flex flex-col flex-grow p-4 sm:p-5">
        <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {nom}
        </h3>

        {description && (
          <p className="text-xs text-amame-muted leading-relaxed line-clamp-2 mb-4">
            {description}
          </p>
        )}

        <div className="mt-auto space-y-1.5">
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
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span>Clôture : {safeFormat(limite)}</span>
          </div>

          {isOpen && (
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold pt-1 ${isUrgent ? "text-red-600" : "text-blue-600"}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
              {isUrgent && <span className="font-bold">· Urgent !</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer : CTA visuel (toute la carte est cliquable) ── */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
        <span
          className={`inline-flex w-full items-center justify-center gap-2 h-10 rounded-xl text-sm font-semibold transition-colors ${
            isClosed
              ? "bg-amame-charcoal/5 text-amame-charcoal group-hover:bg-amame-charcoal/10"
              : "bg-blue-600 text-white group-hover:bg-blue-700"
          }`}
        >
          Voir les détails
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
};

export default ConcoursCardItem;
