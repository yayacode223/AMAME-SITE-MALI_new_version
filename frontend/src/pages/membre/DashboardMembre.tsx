import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useGetAdhesionStatus } from "@/service/adhesionService";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import {
  UserCircleIcon,
  CalendarDaysIcon,
  AcademicCapIcon,
  TrophyIcon,
  BookOpenIcon,
  NewspaperIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon as CheckBadgeSolid } from "@heroicons/react/24/solid";

const PROD_URL = "https://amame.ml";

const QUICK_LINKS = [
  { icon: AcademicCapIcon, label: "Bourses d'études",     href: "/bourses",          color: "bg-blue-50 text-blue-600" },
  { icon: TrophyIcon,      label: "Concours",             href: "/concours",         color: "bg-purple-50 text-purple-600" },
  { icon: BookOpenIcon,    label: "Orientation",          href: "/orientation",      color: "bg-amame-green-subtle text-amame-green" },
  { icon: NewspaperIcon,   label: "Actualités",           href: "/articles",         color: "bg-amame-gold-subtle text-amame-gold" },
];

export default function DashboardMembre() {
  const { user, isAuthenticated, isUserLoading } = useAuth();
  const navigate = useNavigate();

  const { data: adhesion, isLoading: isLoadingAdhesion } = useGetAdhesionStatus({
    enabled: isAuthenticated,
  });

  // Redirection si non connecté ou pas MEMBER
  if (!isUserLoading && !isAuthenticated) {
    navigate("/login");
    return null;
  }
  if (!isUserLoading && user && !["MEMBER", "ADMIN", "SUPERADMIN"].includes(user.role ?? "")) {
    navigate("/adhesion");
    return null;
  }

  if (isUserLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-amame-surface flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-amame-green border-t-transparent rounded-full" />
        </div>
        <Footer />
      </>
    );
  }

  const memberSince = adhesion?.adhesionDate
    ? new Date(adhesion.adhesionDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      <SEO
        title="Mon espace membre — AMAME"
        description="Accédez à votre espace membre AMAME."
        path="/membre/dashboard"
      />
      <Navbar />
      <div className="min-h-screen bg-amame-surface">

        {/* Header membre */}
        <div className="bg-gradient-to-br from-amame-green-darker to-amame-green py-10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="flex items-center gap-5">
              {user?.imagePath ? (
                <img
                  src={`${PROD_URL}/${user.imagePath}`}
                  alt={user.prenom}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-white/40 shrink-0"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <UserCircleIcon className="h-12 w-12 text-white/80" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CheckBadgeSolid className="h-5 w-5 text-amame-gold" />
                  <span className="text-green-100 text-xs font-semibold">Membre AMAME</span>
                </div>
                <h1 className="font-nunito font-bold text-2xl sm:text-3xl text-white leading-tight">
                  {user?.prenom} {user?.nom}
                </h1>
                <p className="text-green-100 text-sm mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl space-y-6">

          {/* Carte statut adhésion */}
          <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-1 flex items-center gap-2">
                  <CheckBadgeIcon className="h-5 w-5 text-amame-green" />
                  Statut d'adhésion
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amame-green-subtle text-amame-green-dark border border-amame-green/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amame-green" />
                    Membre actif
                  </span>
                  {memberSince && (
                    <span className="text-xs text-amame-muted flex items-center gap-1">
                      <CalendarDaysIcon className="h-3.5 w-3.5" />
                      Depuis le {memberSince}
                    </span>
                  )}
                </div>
              </div>
              <Link
                to="/a-propos/membres"
                className="text-xs font-semibold text-amame-green hover:text-amame-green-dark flex items-center gap-1 transition-colors"
              >
                Voir l'équipe <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Infos personnelles */}
          <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
            <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-4">
              Informations personnelles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                { label: "Prénom",       value: user?.prenom },
                { label: "Nom",          value: user?.nom },
                { label: "Email",        value: user?.email },
                { label: "Téléphone",    value: user?.phone || "—" },
                { label: "Ville",        value: user?.ville || "—" },
                { label: "Pays",         value: user?.pays || "—" },
                { label: "Niveau d'étude", value: user?.niveauEtude || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3">
                  <span className="text-xs text-amame-muted w-28 shrink-0 pt-0.5">{label}</span>
                  <span className="text-sm text-amame-charcoal font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-amame-border">
              <Link
                to={`/admin/users/edit/${user?.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amame-green hover:text-amame-green-dark transition-colors"
              >
                Modifier mon profil <ArrowRightIcon className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Accès rapide */}
          <div>
            <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-4">
              Accès rapide
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {QUICK_LINKS.map(({ icon: Icon, label, href, color }) => (
                <Link
                  key={href}
                  to={href}
                  className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl border border-amame-border shadow-card hover:shadow-card-hover transition-all duration-200"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-amame-charcoal text-center leading-tight">
                    {label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Lettre de motivation */}
          {adhesion?.motivation && (
            <div className="bg-white rounded-2xl border border-amame-border shadow-card p-6">
              <h2 className="font-nunito font-bold text-base text-amame-charcoal mb-3">
                Ma lettre de motivation
              </h2>
              <p className="text-sm text-amame-slate leading-7 whitespace-pre-line">
                {adhesion.motivation}
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
