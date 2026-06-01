import { BourseSummary } from "@/types/bourseType";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building, GraduationCap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const formatDate = (dateString?: string) => {
  if (!dateString) return "Non spécifiée";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getFinancementStyle = (statut?: string) => {
  switch (statut?.toLowerCase()) {
    case "complet":
      return "bg-amame-green-light text-amame-green-dark border-amame-green/20";
    case "partiel":
      return "bg-amame-gold-subtle text-amame-gold border-amame-gold/20";
    case "limité":
      return "bg-orange-50 text-orange-700 border-orange-200";
    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
};

const isDeadlineNear = (dateString?: string) => {
  if (!dateString) return false;
  const diff = new Date(dateString).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
};

const BourseCardItem = ({
  id,
  titre,
  descriptionCourte,
  bailleur,
  paysHote,
  niveau,
  categorie,
  financementStatut,
  organisation,
  dateLimite,
}: BourseSummary) => {
  const nearDeadline = isDeadlineNear(dateLimite);

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Gold top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amame-gold to-amame-gold-light" />

      <div className="flex flex-col flex-grow p-5">
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge className={`text-xs font-medium border ${getFinancementStyle(financementStatut)}`}>
            {financementStatut || "Financement"}
          </Badge>
          {categorie && (
            <span className="text-xs text-amame-muted bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
              {categorie}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-2 line-clamp-2 leading-snug group-hover:text-amame-green transition-colors">
          {titre}
        </h3>

        {/* Description */}
        <p className="text-xs text-amame-muted leading-relaxed line-clamp-3 mb-4 flex-grow">
          {descriptionCourte}
        </p>

        {/* Meta info */}
        <div className="space-y-1.5 mb-4">
          {paysHote && (
            <div className="flex items-center gap-2 text-xs text-amame-slate">
              <MapPin className="w-3.5 h-3.5 text-amame-green shrink-0" />
              <span>{paysHote}</span>
            </div>
          )}
          {(bailleur || organisation) && (
            <div className="flex items-center gap-2 text-xs text-amame-slate">
              <Building className="w-3.5 h-3.5 text-amame-gold shrink-0" />
              <span className="line-clamp-1">{bailleur || organisation}</span>
            </div>
          )}
          {niveau && (
            <div className="flex items-center gap-2 text-xs text-amame-slate">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{niveau}</span>
            </div>
          )}
        </div>

        {/* Deadline */}
        {dateLimite && (
          <div className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg mb-4 ${nearDeadline ? "bg-red-50 text-red-700 border border-red-200" : "bg-amame-surface text-amame-slate border border-amame-border"}`}>
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Clôture : {formatDate(dateLimite)}</span>
            {nearDeadline && <span className="ml-auto font-bold text-red-600">Urgent !</span>}
          </div>
        )}

        {/* CTA */}
        <Button asChild className="w-full bg-amame-gold hover:bg-yellow-600 text-white font-semibold rounded-lg text-sm transition-all shadow-sm hover:shadow-md">
          <Link to={`/bourses/${id}`} className="flex items-center justify-center gap-2">
            Voir les détails
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default BourseCardItem;
