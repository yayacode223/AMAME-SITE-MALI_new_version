import React, { useState, useMemo } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, Role } from "@/types/userType";
import {
  HomeIcon,
  NewspaperIcon,
  AcademicCapIcon,
  TrophyIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  HandRaisedIcon,
  ChevronDownIcon,
  ShieldCheckIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import { toast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

/* ---------- Types ---------- */
interface NavSubItem {
  name: string;
  href: string;
}

interface NavGroupItem {
  type: "group";
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  children: NavSubItem[];
}

interface NavLinkItem {
  type: "link";
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  exact?: boolean;
}

type NavItem = NavGroupItem | NavLinkItem;

interface SidebarProps {
  navigation: NavItem[];
  currentPath: string;
  onClose: () => void;
  userInitials: string;
  userName: string;
  userRole: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

/* ---------- Sidebar ---------- */
const Sidebar: React.FC<SidebarProps> = ({
  navigation,
  currentPath,
  onClose,
  userInitials,
  userName,
  userRole,
  onLogout,
  isLoggingOut,
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigation.forEach((item) => {
      if (
        item.type === "group" &&
        item.children.some((child) => currentPath.startsWith(child.href))
      ) {
        initial[item.name] = true;
      }
    });
    return initial;
  });

  const toggleGroup = (name: string) =>
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-100 shrink-0">
        <img
          src="/amame-uploads/amame-logo.webp"
          alt="AMAME"
          className="h-7 w-7 rounded-full object-cover ring-2 ring-green-100 shrink-0"
        />
        <div className="min-w-0">
          <span className="font-nunito font-bold text-sm text-amame-green-dark block leading-tight truncate">
            AMAME
          </span>
          <span className="text-[11px] text-amame-muted font-medium">
            Administration
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {navigation.map((item) => {
          /* ── Lien direct ── */
          if (item.type === "link") {
            const active = item.exact
              ? currentPath === item.href
              : currentPath.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  active
                    ? "bg-amame-green text-white"
                    : "text-amame-slate hover:bg-gray-100 hover:text-amame-charcoal"
                }`}
              >
                <span className="flex-none flex items-center justify-center w-[18px] h-[18px]">
                  <item.icon
                    className={`w-full h-full ${active ? "text-white" : "text-amame-muted"}`}
                  />
                </span>
                <span className="truncate">{item.name}</span>
              </Link>
            );
          }

          /* ── Groupe ── */
          const uniqueHrefs = [...new Set(item.children.map((c) => c.href))];
          const hasUniqueHrefs = uniqueHrefs.length === item.children.length;
          const groupActive = item.children.some((child) =>
            currentPath.startsWith(child.href),
          );
          const isOpen = openGroups[item.name] ?? false;

          return (
            <div key={item.name}>
              <button
                type="button"
                onClick={() => toggleGroup(item.name)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  groupActive
                    ? "bg-green-50 text-amame-green-dark"
                    : "text-amame-slate hover:bg-gray-100 hover:text-amame-charcoal"
                }`}
              >
                <span className="flex-none flex items-center justify-center w-[18px] h-[18px]">
                  <item.icon
                    className={`w-full h-full ${groupActive ? "text-amame-green" : "text-amame-muted"}`}
                  />
                </span>
                <span className="flex-1 truncate text-left">{item.name}</span>
                <ChevronDownIcon
                  className={`flex-none w-3.5 h-3.5 text-amame-muted transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-0.5 ml-[26px] pl-2.5 border-l border-gray-200 space-y-0.5">
                  {item.children.map((child) => {
                    const childActive = currentPath.startsWith(child.href);
                    return (
                      <Link
                        key={child.name}
                        to={child.href}
                        onClick={onClose}
                        className={`flex items-center px-2.5 py-1.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                          childActive && hasUniqueHrefs
                            ? "bg-amame-green text-white"
                            : childActive && !hasUniqueHrefs
                              ? "bg-green-50 text-amame-green-dark"
                              : "text-amame-slate hover:bg-gray-100 hover:text-amame-charcoal"
                        }`}
                      >
                        <span className="truncate">{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Retour au site */}
        <div className="pt-2 mt-2 border-t border-gray-100">
          <Link
            to="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-amame-muted hover:bg-gray-100 hover:text-amame-charcoal transition-colors"
          >
            <span className="flex-none flex items-center justify-center w-[18px] h-[18px]">
              <ArrowLeftIcon className="w-full h-full" />
            </span>
            <span className="truncate">Retour au site</span>
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="shrink-0 p-2 border-t border-gray-100">
        <div className="flex items-center gap-2 px-2 py-2.5 rounded-lg bg-gray-50">
          <div className="flex-none flex items-center justify-center h-7 w-7 rounded-full bg-amame-green">
            <span className="text-white text-xs font-bold leading-none">
              {userInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amame-charcoal truncate">
              {userName}
            </p>
            <p className="text-[11px] text-amame-muted truncate">{userRole}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="flex-none p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Layout principal ---------- */
const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isUserLoading, hasPermission } = useAuth();
  const navigate = useNavigate();

  const navigation = useMemo<NavItem[]>(
    () => {
      const items: NavItem[] = [
        {
          type: "link",
          name: "Tableau de bord",
          href: "/admin",
          icon: HomeIcon,
          exact: true,
        },
      ];

      // Utilisateurs — visibles si l'utilisateur peut lire tous les users
      if (hasPermission("USER_READ_ALL")) {
        items.push({
          type: "link",
          name: "Utilisateurs",
          href: "/admin/users",
          icon: UserGroupIcon,
        });
      }

      return [...items,
      {
        type: "group",
        name: "Bourses",
        icon: AcademicCapIcon,
        children: [
          { name: "Bourse d'étude", href: "/admin/bourses" },
          { name: "Bourse de recherche", href: "/admin/bourses" },
        ],
      },
      {
        type: "group",
        name: "Concours",
        icon: TrophyIcon,
        children: [
          { name: "Concours national", href: "/admin/concours" },
          { name: "Concours international", href: "/admin/concours" },
        ],
      },
      {
        type: "group",
        name: "Orientations",
        icon: BookOpenIcon,
        children: [
          { name: "Universités", href: "/admin/universites" },
          { name: "Filières", href: "/admin/filieres" },
          { name: "Liens Utiles", href: "/admin/liens-utiles" },
          { name: "Ressources Académiques", href: "/admin/ressources" },
        ],
      },
      {
        type: "group",
        name: "Actualités",
        icon: NewspaperIcon,
        children: [
          { name: "Articles", href: "/admin/articles" },
          { name: "Galeries", href: "/admin/galeries" },
        ],
      },
      {
        type: "group",
        name: "À propos",
        icon: HandRaisedIcon,
        children: [
          { name: "Membres", href: "/admin/membres" },
          { name: "Partenaires", href: "/admin/partenaires" },
        ],
      },
      {
        type: "link",
        name: "Adhésions",
        href: "/admin/adhesions",
        icon: IdentificationIcon,
      },
      ];
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasPermission],
  );

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Déconnexion réussie", description: "À bientôt !" });
      navigate("/");
    } catch {
      toast({
        title: "Erreur",
        description: "La déconnexion a échoué.",
        variant: "destructive",
      });
    }
  };

  const userInitials = useMemo(() => {
    if (!user) return "A";
    return `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();
  }, [user]);

  const sidebarProps: SidebarProps = {
    navigation,
    currentPath: location.pathname,
    onClose: () => setSidebarOpen(false),
    userInitials,
    userName: `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() || "Admin",
    userRole: user?.role ? (ROLE_LABELS[user.role as Role] ?? user.role) : "",
    onLogout: handleLogout,
    isLoggingOut: isUserLoading,
  };

  return (
    <div className="min-h-screen bg-amame-surface flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex flex-col w-56 h-full bg-white shadow-xl">
            <button
              type="button"
              className="absolute top-3 right-3 p-1.5 rounded-lg text-amame-muted hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fermer le menu"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
            <Sidebar {...sidebarProps} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:block md:w-56 md:shrink-0">
        <div className="fixed inset-y-0 w-56 bg-white border-r border-amame-border">
          <Sidebar {...sidebarProps} />
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-amame-border px-4 h-12 flex items-center gap-3 shrink-0">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-gray-100 text-amame-muted"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/amame-uploads/amame-logo.webp"
              alt="AMAME"
              className="h-5 w-5 rounded-full object-cover shrink-0"
            />
            <span className="font-nunito font-bold text-sm text-amame-green-dark truncate">
              AMAME Admin
            </span>
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
