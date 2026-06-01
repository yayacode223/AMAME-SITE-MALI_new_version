import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { UserRole } from "@/types/userType";
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from "lucide-react";

const PROD_URL = "https://amame.ml";

/* ---------- Structure de navigation ---------- */
interface SubLink { path: string; label: string }
interface NavItem { path?: string; label: string; children?: SubLink[] }

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Accueil" },
  {
    label: "Bourses",
    children: [
      { path: "/bourses", label: "Toutes les bourses" },
      { path: "/bourses/etude", label: "Bourse d'Étude" },
      { path: "/bourses/recherche", label: "Bourse de Recherche" },
    ],
  },
  {
    label: "Concours",
    children: [
      { path: "/concours", label: "Tous les concours" },
      { path: "/concours/national", label: "Concours National" },
      { path: "/concours/international", label: "Concours International" },
    ],
  },
  {
    label: "Orientations",
    children: [
      { path: "/orientation/universites", label: "Universités" },
      { path: "/orientation", label: "Filières" },
      { path: "/orientation/liens-utiles", label: "Liens Utiles" },
      { path: "/orientation/ressources", label: "Ressources Académiques" },
    ],
  },
  {
    label: "Actualités",
    children: [
      { path: "/articles", label: "Articles" },
      { path: "/galeries", label: "Galeries" },
    ],
  },
  {
    label: "À Propos",
    children: [
      { path: "/a-propos", label: "À Propos" },
      { path: "/a-propos/membres", label: "Membres" },
      { path: "/a-propos/partenaires", label: "Partenaires" },
    ],
  },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout, isLoggingOut, isUserLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setOpenMobileSection(null);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Déconnexion réussie", description: "À bientôt !" });
      navigate("/");
    } catch {
      toast({ title: "Erreur", description: "La déconnexion a échoué.", variant: "destructive" });
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.prenom && user.nom) return `${user.prenom[0]}${user.nom[0]}`.toUpperCase();
    return user.email?.[0].toUpperCase() || "U";
  };

  const isPathActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const isSectionActive = (item: NavItem): boolean => {
    if (item.path) return isPathActive(item.path);
    return item.children?.some((c) => isPathActive(c.path)) ?? false;
  };

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPERADMIN || user?.role === UserRole.EDITOR;
  const hasMembreAccess = ["MEMBER", "ADMIN", "SUPERADMIN", "EDITOR"].includes(user?.role ?? "");

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          isScrolled ? "shadow-[0_1px_20px_rgb(0_0_0/0.08)] border-b border-gray-100" : "border-b border-gray-100"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <img
                src="/amame-uploads/amame-logo.webp"
                alt="AMAME"
                className="h-9 w-9 rounded-full object-cover ring-2 ring-green-100 group-hover:ring-green-200 transition-all"
              />
              <span className="font-nunito font-bold text-xl text-amame-green-dark tracking-tight">
                AMAME
              </span>
            </Link>

            {/* Navigation Desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_ITEMS.map((item) => {
                const active = isSectionActive(item);

                if (!item.children) {
                  return (
                    <Link
                      key={item.path}
                      to={item.path!}
                      className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                        active
                          ? "text-amame-green bg-amame-green-subtle"
                          : "text-gray-600 hover:text-amame-green hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                /* Dropdown avec group-hover */
                return (
                  <div key={item.label} className="relative group">
                    <button
                      type="button"
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                        active
                          ? "text-amame-green bg-amame-green-subtle"
                          : "text-gray-600 hover:text-amame-green hover:bg-gray-50"
                      }`}
                    >
                      {item.label}
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
                    </button>

                    {/* Dropdown panel */}
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-amame-border py-1.5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                      {item.children.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`flex items-center px-4 py-2.5 text-sm transition-colors ${
                            isPathActive(sub.path)
                              ? "text-amame-green bg-amame-green-subtle font-semibold"
                              : "text-gray-700 hover:text-amame-green hover:bg-gray-50"
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Actions Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              {isUserLoading ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors group">
                      <Avatar className="h-8 w-8 ring-2 ring-green-100">
                        <AvatarImage
                          src={user.imagePath ? `${PROD_URL}/${user.imagePath}` : undefined}
                          alt={`${user.prenom} ${user.nom}`}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-amame-green text-white text-xs font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                        {user.prenom}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-1">
                    <DropdownMenuLabel className="font-normal py-2">
                      <p className="font-semibold text-gray-900 text-sm">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                            <LayoutDashboard className="h-4 w-4 text-amame-green" />
                            Dashboard Admin
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {hasMembreAccess && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/membre/dashboard" className="flex items-center gap-2 cursor-pointer">
                            <LayoutDashboard className="h-4 w-4 text-amame-green" />
                            Mon espace membre
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {user.role === "USER" && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/adhesion" className="flex items-center gap-2 cursor-pointer font-medium text-amame-green">
                            <LayoutDashboard className="h-4 w-4" />
                            Adhérer à l'AMAME
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-amame-green hover:bg-amame-green-subtle font-medium">
                    <Link to="/login">Connexion</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-amame-green hover:bg-amame-green-dark text-white font-semibold shadow-green hover:shadow-md transition-all">
                    <Link to="/adhesion">Adhérer</Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile: avatar + burger */}
            <div className="flex lg:hidden items-center gap-2">
              {isAuthenticated && user && !isUserLoading && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="p-1 rounded-full hover:bg-gray-50 transition-colors">
                      <Avatar className="h-8 w-8 ring-2 ring-green-100">
                        <AvatarImage src={user.imagePath ?? undefined} alt={`${user.prenom} ${user.nom}`} className="object-cover" />
                        <AvatarFallback className="bg-amame-green text-white text-xs font-bold">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="font-normal">
                      <p className="font-semibold text-sm">{user.prenom} {user.nom}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-amame-green" />
                          Dashboard Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {hasMembreAccess && (
                      <DropdownMenuItem asChild>
                        <Link to="/membre/dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-amame-green" />
                          Mon espace membre
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="text-red-600 focus:bg-red-50 cursor-pointer flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-x-0 bottom-0 top-16 z-40 lg:hidden bg-black/30 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile menu panel */}
      <div
        className={`fixed top-16 left-0 right-0 z-40 lg:hidden bg-white border-b border-gray-200 shadow-xl transition-all duration-300 ease-in-out max-h-[80vh] overflow-y-auto ${
          isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 py-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            if (!item.children) {
              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isSectionActive(item)
                      ? "text-amame-green bg-amame-green-subtle font-semibold"
                      : "text-gray-700 hover:text-amame-green hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            const isExpanded = openMobileSection === item.label;
            const active = isSectionActive(item);

            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => setOpenMobileSection(isExpanded ? null : item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    active ? "text-amame-green bg-amame-green-subtle" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                </button>

                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-amame-green/20 pl-3">
                    {item.children.map((sub) => (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isPathActive(sub.path)
                            ? "text-amame-green font-semibold"
                            : "text-gray-600 hover:text-amame-green hover:bg-gray-50"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Auth mobile */}
          {!isAuthenticated && (
            <div className="pt-3 mt-3 border-t border-gray-100 space-y-2">
              <Button asChild variant="outline" className="w-full border-amame-green text-amame-green hover:bg-amame-green-subtle font-semibold">
                <Link to="/login">Connexion</Link>
              </Button>
              <Button asChild className="w-full bg-amame-green hover:bg-amame-green-dark text-white font-semibold shadow-green">
                <Link to="/adhesion">Adhérer à l'AMAME</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
