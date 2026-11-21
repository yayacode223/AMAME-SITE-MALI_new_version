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

const isDeadlineNear = (dateString?: string) => {
  if (!dateString) return false;
  const diff = new Date(dateString).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};

const BourseCardItem = ({ id, titre, descriptionCourte, paysHote, dateLimite }: BourseSummary) => {
  const flagImage  = getFlagImage(paysHote);
  const nearDeadline = isDeadlineNear(dateLimite);

  return (
    // Carte .amame-card (index.css) ; couleur du domaine : or (amber-700 pour le texte, 5:1 sur blanc).
    <Link to={`/bourses/${id}`} className="amame-card amame-card-interactive group">

      {/* Média — drapeau du pays hôte */}
      <div className="amame-card-media bg-gradient-to-br from-amame-gold-subtle to-amame-gold/10">
        {flagImage ? (
          <StaticImage
            name={flagImage}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            alt={paysHote ?? ""}
            className="amame-card-img"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="h-10 w-10 text-amame-gold/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
        {/* Pays sur cartouche sombre : posé à même le drapeau, le blanc tombait à 3,0–4,5:1 (docs/06, R9) */}
        {paysHote && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 amame-photo-cartouche rounded-full px-2.5 py-1 ring-1 ring-white/20">
            <MapPin className="h-3 w-3 text-white shrink-0" />
            <span className="text-white text-xs font-semibold">{paysHote}</span>
          </div>
        )}
      </div>

      {/* Corps */}
      <div className="amame-card-body">
        <h3 className="amame-card-title group-hover:text-amber-700">{titre}</h3>
        {descriptionCourte && <p className="amame-card-text mt-2">{descriptionCourte}</p>}
      </div>

      {/* Pied — date limite, action */}
      <div className="amame-card-footer">
        <div className={`flex items-center gap-1.5 text-xs font-medium min-w-0 ${nearDeadline ? "text-red-600" : "text-amame-slate"}`}>
          <Calendar className={`h-3.5 w-3.5 shrink-0 ${nearDeadline ? "text-red-500" : "text-amame-gold"}`} />
          <span className="truncate">{formatDate(dateLimite)}</span>
          {nearDeadline && <span className="font-bold shrink-0">· Urgent</span>}
        </div>
        <span className="amame-card-action text-amber-700 group-hover:gap-1.5">
          Voir la bourse <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
};

export default BourseCardItem;
