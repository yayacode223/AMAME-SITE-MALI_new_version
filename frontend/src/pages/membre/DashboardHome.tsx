import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useGetAdhesionStatus } from "@/service/adhesionService";
import { useEspaceStats } from "@/service/monEspaceService";
import {
  CheckBadgeIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  HeartIcon,
  AcademicCapIcon,
  TrophyIcon,
  BookOpenIcon,
  NewspaperIcon,
  ArrowRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeSolid } from "@heroicons/react/24/solid";

const PROD_URL = "https://amame.ml";

const QUICK_LINKS = [
  { icon: AcademicCapIcon, label: "Bourses",      href: "/bourses",     color: "bg-blue-50 text-blue-600" },
  { icon: TrophyIcon,      label: "Concours",     href: "/concours",    color: "bg-purple-50 text-purple-600" },
  { icon: BookOpenIcon,    label: "Orientation",  href: "/orientation", color: "bg-amame-green-subtle text-amame-green" },
  { icon: NewspaperIcon,   label: "Actualités",   href: "/articles",    color: "bg-amame-gold-subtle text-amame-gold" },
];

export default function DashboardHome() {
  const { user, isAuthenticated } = useAuth();
  const { data: adhesion } = useGetAdhesionStatus({ enabled: isAuthenticated });
  const { data: stats }    = useEspaceStats();

  const memberSince = adhesion?.adhesionDate
    ? new Date(adhesion.adhesionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const anneeEnCours = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* ── Profil banner ── */}
      <div className="bg-gradient-to-br from-amame-green-darker to-amame-green rounded-2xl p-6 flex items-center gap-4">
        {user?.imagePath ? (
          <img
            src={`${PROD_URL}/${user.imagePath}`}
            alt={user.prenom}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-white/30 shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <UserCircleIcon className="h-10 w-10 text-white/80" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <CheckBadgeSolid className="h-4 w-4 text-amame-gold" />
            <span className="text-green-100 text-xs font-semibold">Membre AMAME</span>
          </div>
          <h1 className="font-nunito font-bold text-xl sm:text-2xl text-white leading-tight">
            Bonjour, {user?.prenom} !
          </h1>
          <p className="text-green-100/80 text-sm mt-0.5">{user?.email}</p>
        </div>
      </div>

      {/* ── Cartes stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Statut adhésion */}
        <div className="bg-white rounded-2xl border border-amame-border shadow-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amame-green-subtle rounded-xl flex items-center justify-center">
              <CheckBadgeIcon className="h-5 w-5 text-amame-green" />
            </div>
            <span className="text-xs font-semibold text-amame-muted uppercase tracking-wide">Adhésion</span>
          </div>
          <p className="font-nunito font-bold text-sm text-amame-charcoal">Membre actif</p>
          {memberSince && (
            <p className="text-xs text-amame-muted mt-1 flex items-center gap-1">
              <CalendarDaysIcon className="h-3.5 w-3.5" />
              Depuis {memberSince}
            </p>
          )}
        </div>

        {/* Cotisation */}
        <Link to="/membre/cotisation" className="bg-white rounded-2xl border border-amame-border shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stats?.cotisationAJourCetteAnnee ? "bg-amame-green-subtle" : "bg-yellow-50"}`}>
              <CreditCardIcon className={`h-5 w-5 ${stats?.cotisationAJourCetteAnnee ? "text-amame-green" : "text-yellow-500"}`} />
            </div>
            <span className="text-xs font-semibold text-amame-muted uppercase tracking-wide">Cotisation {anneeEnCours}</span>
          </div>
          <p className={`font-nunito font-bold text-sm ${stats?.cotisationAJourCetteAnnee ? "text-amame-green-dark" : "text-yellow-700"}`}>
            {stats?.cotisationAJourCetteAnnee ? "À jour" : "Non enregistrée"}
          </p>
          <p className="text-xs text-amame-muted mt-1">Voir le détail →</p>
        </Link>

        {/* Dons */}
        <Link to="/membre/don" className="bg-white rounded-2xl border border-amame-border shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
              <HeartIcon className="h-5 w-5 text-red-500" />
            </div>
            <span className="text-xs font-semibold text-amame-muted uppercase tracking-wide">Mes dons</span>
          </div>
          <p className="font-nunito font-bold text-sm text-amame-charcoal">
            {stats?.totalDons ?? 0} don{(stats?.totalDons ?? 0) > 1 ? "s" : ""}
          </p>
          {stats && stats.totalMontantDons > 0 && (
            <p className="text-xs text-amame-muted mt-1">
              Total : {Number(stats.totalMontantDons).toLocaleString("fr-FR")} FCFA
            </p>
          )}
        </Link>

        {/* Profil complétude */}
        <Link to="/membre/profil" className="bg-white rounded-2xl border border-amame-border shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <UserCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-amame-muted uppercase tracking-wide">Profil</span>
          </div>
          <p className="font-nunito font-bold text-sm text-amame-charcoal">
            {user?.prenom} {user?.nom}
          </p>
          <p className="text-xs text-amame-muted mt-1">Compléter mon profil →</p>
        </Link>
      </div>

      {/* ── Accès rapide ── */}
      <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
        <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-4">Accès rapide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map(({ icon: Icon, label, href, color }) => (
            <Link
              key={href}
              to={href}
              className="group flex flex-col items-center gap-2.5 p-4 rounded-xl border border-amame-border hover:shadow-card-hover transition-all duration-200"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-amame-charcoal text-center leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Infos adhésion ── */}
      {adhesion?.motivation && (
        <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
          <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-3">Ma lettre de motivation</h2>
          <p className="text-sm text-amame-slate leading-7 whitespace-pre-line">{adhesion.motivation}</p>
        </div>
      )}
    </div>
  );
}
