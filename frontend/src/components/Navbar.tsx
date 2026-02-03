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
const url = "https://amame.ml";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, user, logout, isLoggingOut, isUserLoading } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Déconnexion réussie", description: "À bientôt !" });
      navigate("/");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "La déconnexion a échoué.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (!user) return "";
    if (user.prenom && user.nom) {
      return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = useMemo(
    () => [
      { path: "/", label: "Accueil" },
      { path: "/bourses", label: "Bourses" },
      { path: "/concours", label: "Concours" },
      { path: "/orientation", label: "Orientations" },
      { path: "/articles", label: "Actualités" },
      { path: "/a-propos", label: "À Propos" },
    ],
    []
  );

  // Composant pour l'avatar avec dropdown (desktop seulement)
  const UserAvatarDropdown = () => {
    if (isUserLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full hover:bg-purple-50 transition-colors"
            >
              <Avatar className="h-9 w-9 border-2 border-purple-100">
                <AvatarImage
                  src={user?.imagePath ? `${url}/${user.imagePath}` : undefined}
                  alt={`${user?.prenom} ${user?.nom}`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-medium leading-none text-gray-900">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs leading-none text-gray-500">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user?.role === UserRole.ADMIN && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="cursor-pointer w-full">
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return null;
  };

  // Composant pour les boutons auth (desktop seulement)
  const AuthButtonsDesktop = () => {
    if (isAuthenticated) return null;

    return (
      <div className="hidden lg:flex items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="text-gray-700 hover:text-purple-700"
        >
          <Link to="/login">Connexion</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm"
        >
          <Link to="/register">S'inscrire</Link>
        </Button>
      </div>
    );
  };

  const NavLink = ({ path, label }: { path: string; label: string }) => (
    <Link
      to={path}
      className={`relative px-3 py-2 font-medium transition-colors duration-200 ${
        isActiveRoute(path)
          ? "text-purple-700"
          : "text-gray-700 hover:text-purple-600"
      }`}
    >
      {label}
      {isActiveRoute(path) && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-full" />
      )}
    </Link>
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg py-3 border-b border-gray-100"
          : "bg-white py-4 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 hover:opacity-90 transition-opacity"
          >
            <img
              src="/amame-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png"
              alt="AMAME Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover"
            />
            <span className="font-nunito font-bold text-xl sm:text-2xl text-purple-700">
              AMAME
            </span>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navLinks.map((link) => (
              <NavLink key={link.path} {...link} />
            ))}
          </div>

          {/* Section d'authentification desktop */}
          <div className="flex items-center gap-2">
            {/* Avatar pour desktop (connecté) */}
            <div className="hidden lg:block">
              <UserAvatarDropdown />
            </div>

            {/* Boutons auth pour desktop (non connecté) */}
            <AuthButtonsDesktop />
          </div>

          {/* Bouton du menu mobile */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Avatar pour mobile (connecté) - AVEC DROPDOWN CLICABLE */}
            {isAuthenticated && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-1 mr-2 rounded-full hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    aria-label="Menu utilisateur"
                  >
                    <Avatar className="h-8 w-8 border-2 border-purple-100">
                      <AvatarImage
                        src={user?.imagePath ?? undefined}
                        alt={`${user?.prenom} ${user?.nom}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 lg:hidden">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="font-medium leading-none text-gray-900">
                        {user?.prenom} {user?.nom}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === UserRole.ADMIN && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer w-full">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer focus:text-red-700 focus:bg-red-50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                    isOpen ? "rotate-45 translate-y-1" : "-translate-y-1"
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                    isOpen ? "opacity-0" : "opacity-100"
                  }`}
                />
                <span
                  className={`block h-0.5 w-6 bg-current transition-all duration-300 ${
                    isOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white border-t border-gray-200 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 font-medium transition-colors rounded-lg mx-2 ${
                  isActiveRoute(link.path)
                    ? "text-purple-700 bg-purple-50"
                    : "text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Section auth pour mobile - UNIQUEMENT si NON connecté */}
            {!isAuthenticated && (
              <div className="border-t border-gray-200 mt-4 pt-4 px-4 space-y-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full justify-center text-gray-700 hover:text-purple-700 border-gray-300"
                >
                  <Link to="/login">Connexion</Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-center bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <Link to="/register">S'inscrire</Link>
                </Button>
              </div>
            )}

            {/* Section utilisateur pour mobile si connecté */}
            {isAuthenticated && user && (
              <div className="border-t border-gray-200 mt-4 pt-4 px-4 space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <Avatar className="h-10 w-10 border-2 border-purple-100">
                    <AvatarImage
                      src={user?.imagePath ?? undefined}
                      alt={`${user?.prenom} ${user?.nom}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.prenom} {user?.nom}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                {user?.role === UserRole.ADMIN && (
                  <Link
                    to="/admin"
                    className="block px-4 py-3 font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 rounded-lg mx-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-4 py-3 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg mx-2 text-left transition-colors"
                >
                  {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;