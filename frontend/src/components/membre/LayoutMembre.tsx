import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  HomeIcon,
  BoltIcon,
  CreditCardIcon,
  HeartIcon,
  UserIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { LogOut } from "lucide-react";

const PROD_URL = "https://amame.ml";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/membre/dashboard",  label: "Tableau de bord", icon: HomeIcon       },
  { href: "/membre/activite",   label: "Activité",        icon: BoltIcon       },
  { href: "/membre/cotisation", label: "Cotisation",      icon: CreditCardIcon },
  { href: "/membre/don",        label: "Faire un Don",    icon: HeartIcon      },
  { href: "/membre/profil",     label: "Profil",          icon: UserIcon       },
  { href: "/membre/parametres", label: "Paramètres",      icon: Cog6ToothIcon  },
];

/* ── Sidebar content ────────────────────────────────────────────────────────── */
function SidebarContent({ onClose }: { onClose: () => void }) {
  const location  = useLocation();
  const navigate  = useNavigate();
  const { user, logout, isLoggingOut } = useAuth();

  const initials = user
    ? `${user.prenom?.[0] ?? ""}${user.nom?.[0] ?? ""}`.toUpperCase()
    : "M";

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Déconnexion réussie", description: "À bientôt !" });
      navigate("/");
    } catch {
      toast({ title: "Erreur", description: "La déconnexion a échoué.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-gray-100 shrink-0">
        <img
          src="/amame-uploads/amame-logo.webp"
          alt="AMAME"
          className="h-7 w-7 rounded-full object-cover ring-2 ring-green-100 shrink-0"
        />
        <div className="min-w-0">
          <p className="font-nunito font-bold text-sm text-amame-green-dark leading-tight">AMAME</p>
          <p className="text-[11px] text-amame-muted">Espace membre</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = location.pathname === href;
          return (
            <Link
              key={href}
              to={href}
              onClick={onClose}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                active
                  ? "bg-amame-green text-white"
                  : "text-amame-slate hover:bg-gray-100 hover:text-amame-charcoal"
              }`}
            >
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-white" : "text-amame-muted"}`} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        {/* Retour au site */}
        <div className="pt-2 mt-2 border-t border-gray-100">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-amame-muted hover:bg-gray-100 hover:text-amame-charcoal transition-colors"
          >
            <ArrowLeftIcon className="h-[18px] w-[18px] shrink-0" />
            <span>Retour au site</span>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="shrink-0 p-2 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2.5 rounded-lg bg-gray-50">
          {/* Avatar */}
          {user?.imagePath ? (
            <img
              src={`${PROD_URL}/${user.imagePath}`}
              alt={user.prenom}
              className="h-7 w-7 rounded-full object-cover shrink-0 ring-1 ring-green-100"
            />
          ) : (
            <div className="h-7 w-7 rounded-full bg-amame-green flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amame-charcoal truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-[11px] text-amame-muted truncate">Membre AMAME</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Layout principal ────────────────────────────────────────────────────────── */
export default function LayoutMembre() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, isAuthenticated, isUserLoading } = useAuth();

  // Guard : redirige si non authentifié ou rôle insuffisant
  useEffect(() => {
    if (isUserLoading) return;
    if (!isAuthenticated) { navigate("/login"); return; }
    if (!["MEMBER", "ADMIN", "SUPERADMIN", "EDITOR"].includes(user?.role ?? "")) {
      navigate("/adhesion");
    }
  }, [isUserLoading, isAuthenticated, user, navigate]);

  // Ferme le menu mobile à chaque changement de page
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amame-surface">
        <div className="animate-spin h-8 w-8 border-2 border-amame-green border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentNavItem = NAV_ITEMS.find(n => n.pathname === location.pathname) ?? NAV_ITEMS.find(n => location.pathname.startsWith(n.href));

  return (
    <div className="min-h-screen bg-amame-surface flex">
      {/* ── Overlay mobile ─────────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 flex flex-col w-60 h-full bg-white shadow-xl">
            <button
              type="button"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-amame-muted hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── Sidebar desktop ─────────────────────────────────────────────────── */}
      <aside className="hidden md:block md:w-60 md:shrink-0">
        <div className="fixed inset-y-0 w-60 bg-white border-r border-amame-border">
          <SidebarContent onClose={() => {}} />
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="md:hidden sticky top-0 z-30 bg-white border-b border-amame-border px-4 h-13 flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-amame-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img
              src="/amame-uploads/amame-logo.webp"
              alt="AMAME"
              className="h-5 w-5 rounded-full object-cover shrink-0"
            />
            <span className="font-nunito font-bold text-sm text-amame-green-dark truncate">
              Mon espace
            </span>
          </div>
          {/* Page active name on mobile */}
          {currentNavItem && (
            <span className="text-xs text-amame-muted shrink-0 hidden sm:block">
              {currentNavItem.label}
            </span>
          )}
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
