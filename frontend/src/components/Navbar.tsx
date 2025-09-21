import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, user, logout, isLoggingOut, isUserLoading } =
    useAuth();
  const navigate = useNavigate();

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
  };

  

  const renderAuthSection = () => {
    if (isUserLoading) {
      return (
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.imagePath ?? undefined}
                  alt={user.email}
                />
                <AvatarFallback className="bg-purple-600 text-white font-bold">
                  { getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="font-medium leading-none">
                  {user.prenom} {user.nom}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profil" className="cursor-pointer">
                Mon Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 cursor-pointer"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <Button asChild variant="ghost">
          <Link to="/login">Connexion</Link>
        </Button>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link to="/register">S'inscrire</Link>
        </Button>
      </div>
    );
  };

  return (
    <nav className="bg-white shadow-md py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* --- Logo --- */}
        <Link to="/" className="flex items-center space-x-2">
          <img
            src="/lovable-uploads/24ceb186-cbc8-4d01-99bd-635d9bd2df31.png"
            alt="AMAME Logo"
            className="h-12 w-12 rounded-full"
          />
          <span className="font-nunito font-bold text-xl text-purple-700">
            AMAME
          </span>
        </Link>

        {/* --- Navigation Desktop --- */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link
            to="/"
            className="text-gray-700 hover:text-purple-600 font-medium"
          >
            Accueil
          </Link>
          <Link
            to="/concours"
            className="text-gray-700 hover:text-purple-600 font-medium"
          >
            Concours
          </Link>
          <Link
            to="/filieres"
            className="text-gray-700 hover:text-purple-600 font-medium"
          >
            Séries et Filières
          </Link>
          <Link
            to="/bourses"
            className="text-gray-700 hover:text-purple-600 font-medium"
          >
            Bourses d'études
          </Link>
          <Link
            to="/ressources"
            className="text-gray-700 hover:text-purple-600 font-medium"
          >
            Ressources
          </Link>
        </div>

        {/* --- Section d'authentification (desktop) --- */}
        <div className="hidden md:flex items-center">{renderAuthSection()}</div>

        {/* --- Bouton du menu mobile --- */}
        <div className="md:hidden">
          <button
            onClick={toggleMenu}
            className="p-2 focus:outline-none"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <svg
              className="w-6 h-6 text-purple-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* --- Menu Mobile --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-t animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-3">
            <Link
              to="/"
              className="text-gray-700 hover:text-purple-600 font-medium py-2"
              onClick={toggleMenu}
            >
              Accueil
            </Link>
            <Link
              to="/concours"
              className="text-gray-700 hover:text-purple-600 font-medium py-2"
              onClick={toggleMenu}
            >
              Concours
            </Link>
            <Link
              to="/filieres"
              className="text-gray-700 hover:text-purple-600 font-medium py-2"
              onClick={toggleMenu}
            >
              Séries et Filières
            </Link>
            <Link
              to="/bourses"
              className="text-gray-700 hover:text-purple-600 font-medium py-2"
              onClick={toggleMenu}
            >
              Bourses d'études
            </Link>
            <Link
              to="/ressources"
              className="text-gray-700 hover:text-purple-600 font-medium py-2"
              onClick={toggleMenu}
            >
              Ressources
            </Link>

            <div className="border-t pt-4 mt-4">{renderAuthSection()}</div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
