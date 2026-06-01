import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, GraduationCap, Clock, Target, ArrowRight } from "lucide-react";
import { format, isAfter, isBefore, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ConcoursCardItemProps {
  id: number;
  nom: string;
  description: string;
  pays: string;
  niveau: string;
  status: string;
  dateOuverture: string;
  dateLimite: string;
  lienOfficiel: string;
  isAvailable: boolean;
}

const getNiveauLabel = (niveau: string) => {
  const labels: Record<string, string> = {
    BACHELIER: "Bachelier",
    LICENCE: "Licence",
    MASTER: "Master",
    DOCTORAT: "Doctorat",
  };
  return labels[niveau] || niveau;
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
  isAvailable,
}: ConcoursCardItemProps) => {
  const now = new Date();
  const ouverture = new Date(dateOuverture);
  const limite = new Date(dateLimite);

  const isOpen = isAfter(now, ouverture) && isBefore(now, limite);
  const isUpcoming = isBefore(now, ouverture);
  const isClosed = isAfter(now, limite);
  const daysLeft = isOpen ? differenceInDays(limite, now) : 0;
  const available = isAvailable && !isClosed;

  const getStatusConfig = () => {
    if (!isAvailable || isClosed) return { label: "Clôturé", cls: "bg-gray-100 text-gray-500 border-gray-200" };
    if (isUpcoming) return { label: "À venir", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    return { label: "Ouvert", cls: "bg-amame-green-light text-amame-green-dark border-amame-green/20" };
  };

  const { label: statusLabel, cls: statusCls } = getStatusConfig();
  const isUrgent = isOpen && daysLeft <= 7;

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-amame-border shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
      {/* Blue top accent */}
      <div className={`h-1 w-full ${available ? "bg-gradient-to-r from-blue-500 to-blue-400" : "bg-gray-200"}`} />

      <div className="flex flex-col flex-grow p-5">
        {/* Status row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge className={`text-xs font-medium border ${statusCls}`}>
            {statusLabel}
          </Badge>
          <div className="flex items-center gap-1.5">
            <Badge className="text-xs border bg-gray-50 text-gray-600 border-gray-200">
              <Target className="h-3 w-3 mr-1" />
              {status === "NATIONAL" ? "National" : "International"}
            </Badge>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-nunito font-bold text-base text-amame-charcoal mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {nom}
        </h3>

        {/* Description */}
        <p className="text-xs text-amame-muted leading-relaxed line-clamp-3 mb-4 flex-grow">
          {description}
        </p>

        {/* Meta info */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <MapPin className="h-3.5 w-3.5 text-amame-green shrink-0" />
            <span>{pays}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            <span>{getNiveauLabel(niveau)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <Calendar className="h-3.5 w-3.5 text-amame-gold shrink-0" />
            <span>Ouverture : {format(ouverture, "dd MMM yyyy", { locale: fr })}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-amame-slate">
            <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span>Clôture : {format(limite, "dd MMM yyyy", { locale: fr })}</span>
          </div>
        </div>

        {/* Days remaining pill */}
        {isOpen && (
          <div className={`flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg mb-4 ${isUrgent ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            <Clock className="h-3.5 w-3.5" />
            {daysLeft} jour{daysLeft > 1 ? "s" : ""} restant{daysLeft > 1 ? "s" : ""}
            {isUrgent && <span className="ml-auto font-bold">Urgent !</span>}
          </div>
        )}

        {/* CTA */}
        <Button
          asChild={available}
          disabled={!available}
          className={`w-full font-semibold rounded-lg text-sm transition-all ${available ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
        >
          {available ? (
            <Link to={`/concours/${id}`} className="flex items-center justify-center gap-2">
              Voir les détails
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {statusLabel}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConcoursCardItem;
