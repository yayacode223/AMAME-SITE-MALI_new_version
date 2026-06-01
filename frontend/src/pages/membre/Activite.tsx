import { useAuth } from "@/context/AuthContext";
import { useGetAdhesionStatus } from "@/service/adhesionService";
import { useMyCotisations, useMyDons, COTISATION_STATUS_STYLES, COTISATION_STATUS_LABELS } from "@/service/monEspaceService";
import {
  CheckBadgeIcon,
  CreditCardIcon,
  HeartIcon,
  BoltIcon,
} from "@heroicons/react/24/outline";

interface TimelineEvent {
  date: string;
  label: string;
  sublabel?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function Activite() {
  const { isAuthenticated } = useAuth();
  const { data: adhesion }    = useGetAdhesionStatus({ enabled: isAuthenticated });
  const { data: cotisations = [] } = useMyCotisations();
  const { data: dons = [] }        = useMyDons();

  // Construction de la timeline par date décroissante
  const events: TimelineEvent[] = [];

  if (adhesion?.adhesionDate) {
    events.push({
      date: adhesion.adhesionDate,
      label: "Adhésion approuvée",
      sublabel: "Vous avez rejoint la communauté AMAME",
      icon: CheckBadgeIcon,
      color: "bg-amame-green-subtle text-amame-green",
    });
  }

  cotisations.forEach((c) => {
    events.push({
      date: c.datePaiement ?? c.createdAt,
      label: `Cotisation ${c.annee}`,
      sublabel: `${Number(c.montant).toLocaleString("fr-FR")} FCFA — ${COTISATION_STATUS_LABELS[c.status]}`,
      icon: CreditCardIcon,
      color: `${COTISATION_STATUS_STYLES[c.status]} border`,
    });
  });

  dons.forEach((d) => {
    events.push({
      date: d.dateDon,
      label: `Don — ${Number(d.montant).toLocaleString("fr-FR")} FCFA`,
      sublabel: d.message ?? undefined,
      icon: HeartIcon,
      color: "bg-red-50 text-red-500",
    });
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-nunito font-bold text-xl sm:text-2xl text-amame-charcoal">Activité</h1>
        <p className="text-sm text-amame-muted mt-1">Historique de toutes vos actions dans l'espace membre.</p>
      </div>

      <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-50 rounded-full mb-4">
              <BoltIcon className="h-7 w-7 text-gray-300" />
            </div>
            <p className="text-sm text-amame-muted">Aucune activité enregistrée pour le moment.</p>
          </div>
        ) : (
          <ol className="relative border-l border-gray-200 ml-3 space-y-0">
            {events.map((event, idx) => {
              const Icon = event.icon;
              return (
                <li key={idx} className="mb-8 ml-6 last:mb-0">
                  {/* Dot sur la ligne */}
                  <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white ${event.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-semibold text-sm text-amame-charcoal">{event.label}</p>
                    <time className="text-xs text-amame-muted shrink-0">{formatDate(event.date)}</time>
                  </div>
                  {event.sublabel && (
                    <p className="text-xs text-amame-muted mt-1 leading-relaxed">{event.sublabel}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
