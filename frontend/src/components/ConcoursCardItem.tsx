// components/ConcoursCardItem.tsx - Version harmonisée Blue-Violet
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  GraduationCap,
  ExternalLink,
  Clock,
  Target,
} from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
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

const ConcoursCardItem = ({
  id,
  nom,
  description,
  pays,
  niveau,
  status,
  dateOuverture,
  dateLimite,
  lienOfficiel,
  isAvailable,
}: ConcoursCardItemProps) => {
  const now = new Date();
  const ouverture = new Date(dateOuverture);
  const limite = new Date(dateLimite);

  const isOpen = isAfter(now, ouverture) && isBefore(now, limite);
  const isUpcoming = isBefore(now, ouverture);
  const isClosed = isAfter(now, limite);

  const getStatusColor = () => {
    if (!isAvailable) return "bg-gray-100 text-gray-700";
    if (isClosed) return "bg-red-100 text-red-700";
    if (isUpcoming) return "bg-blue-100 text-blue-700";
    return "bg-green-100 text-green-700";
  };

  const getStatusText = () => {
    if (!isAvailable) return "Indisponible";
    if (isClosed) return "Clôturé";
    if (isUpcoming) return "À venir";
    return "Ouvert";
  };

  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy", { locale: fr });
  };

  const getNiveauLabel = (niveau: string) => {
    const labels: { [key: string]: string } = {
      BACHELIER: "Bachelier",
      LICENCE: "Licence",
      MASTER: "Master",
      DOCTORAT: "Doctorat",
    };
    return labels[niveau] || niveau;
  };

  const getDaysRemaining = () => {
    const diffTime = limite.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="border-0 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between mb-3">
            <Badge variant="secondary" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            {isOpen && !isClosed && (
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-700 border-purple-200"
              >
                {getDaysRemaining()} jour{getDaysRemaining() > 1 ? "s" : ""}{" "}
                restant{getDaysRemaining() > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight mb-2">
            {nom}
          </h3>

          {/* Badges informations */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 text-xs"
            >
              <GraduationCap className="h-3 w-3 mr-1" />
              {getNiveauLabel(niveau)}
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200 text-xs"
            >
              <Target className="h-3 w-3 mr-1" />
              {status === "NATIONAL" ? "National" : "International"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex-grow pb-4">
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
            {description}
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="font-medium">{pays}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span>Date début Concours: {formatDate(ouverture)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
              <span>Clôture: {formatDate(limite)}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 border-t border-gray-100">
          <Button
            asChild
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
            disabled={!isAvailable || isClosed}
          >
            <Link to={`/concours/${id}`}>
              Voir les détails <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          {!isAvailable || isClosed ? (
            <Button
              className="w-full bg-gray-200 text-gray-500 font-semibold py-2.5 rounded-xl cursor-not-allowed"
              disabled
            >
              Indisponible
            </Button>
          ) : (
            <Button
              asChild
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
            >
              <Link to={`/concours/${id}`}>
                Voir les détails <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default ConcoursCardItem;
