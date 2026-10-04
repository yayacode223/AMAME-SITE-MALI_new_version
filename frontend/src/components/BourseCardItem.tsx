import { BourseSummary } from "@/types/bourseType";
import type { StaticImageName } from "@/generated/staticImages";
import StaticImage from "@/components/StaticImage";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";


const flagMap: Record<string, StaticImageName> = {
  "france":      "bourses/france",
  "canada":      "bourses/canada",
  "états-unis":  "bourses/etats-unis",
  "allemagne":   "bourses/allemagne",
  "royaume-uni": "bourses/angleterre",
  "angleterre":  "bourses/angleterre",
  "australie":   "bourses/australie",
  "suisse":      "bourses/suisse",
  "suède":       "bourses/suede",
};

const getFlagImage = (pays?: string): StaticImageName | null => {
  if (!pays) return null;
  return flagMap[pays.toLowerCase()] ?? null;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Non spécifiée";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const truncateWords = (text: string | undefined, max: number) => {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  return words.length > max ? words.slice(0, max).join(" ") + "…" : text;
};

const isDeadlineNear = (dateString?: string) => {
  if (!dateString) return false;
  const diff = new Date(dateString).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};

const BourseCardItem = ({ id, titre, descriptionCourte, paysHote, dateLimite }: BourseSummary) => {
  const flagImage  = getFlagImage(paysHote);
  const nearDeadline = isDeadlineNear(dateLimite);

  return (
    <Link to={`/bourses/${id}`} className="block h-full group">
      <div className="h-full flex flex-col bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden">

        {/* Header — Drapeau */}
        <div className="relative h-36 overflow-hidden shrink-0 bg-gradient-to-br from-amame-gold-subtle to-amame-gold/10">
          {flagImage ? (
            <StaticImage
              name={flagImage}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              alt={paysHote ?? ""}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-10 w-10 text-amame-gold/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
          {paysHote && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-white/80 shrink-0" />
              <span className="text-white text-xs font-semibold drop-shadow-sm">{paysHote}</span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-grow px-4 pt-4 pb-3">
          <h3 className="font-nunito font-bold text-sm text-amame-charcoal mb-2 line-clamp-2 leading-snug group-hover:text-amame-gold transition-colors duration-200">
            {titre}
          </h3>
          <p className="text-xs text-amame-muted leading-relaxed flex-grow">
            {truncateWords(descriptionCourte, 10)}
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-3 border-t border-amame-border flex items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-medium min-w-0 ${nearDeadline ? "text-red-600" : "text-amame-slate"}`}>
            <Calendar className={`h-3.5 w-3.5 shrink-0 ${nearDeadline ? "text-red-500" : "text-amame-gold"}`} />
            <span className="truncate">{formatDate(dateLimite)}</span>
            {nearDeadline && <span className="font-bold shrink-0">· Urgent</span>}
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-amame-gold shrink-0 group-hover:gap-1.5 transition-all duration-200">
            Voir <ArrowRight className="h-3 w-3" />
          </div>
        </div>

      </div>
    </Link>
  );
};

export default BourseCardItem;
