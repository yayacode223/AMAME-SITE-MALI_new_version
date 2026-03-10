import React, { useState, useMemo } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  NewspaperIcon,
  AcademicCapIcon,
  TrophyIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isUserLoading } = useAuth();
  const navigate = useNavigate();

  const navigation = useMemo(
    () => [
      {
        name: "Tableau de bord",
        href: "/admin",
        icon: HomeIcon,
        current: location.pathname === "/admin",
      },
      {
        name: "Utilisateurs",
        href: "/admin/users",
        icon: UserGroupIcon,
        current: location.pathname.includes("/admin/users"),
      },
      {
        name: "Actualités",
        href: "/admin/articles",
        icon: NewspaperIcon,
        current: location.pathname.includes("/admin/articles"),
      },
      {
        name: "Bourses",
        href: "/admin/bourses",
        icon: AcademicCapIcon,
        current: location.pathname.includes("/admin/bourses"),
      },
      {
        name: "Concours",
        href: "/admin/concours",
        icon: TrophyIcon,
        current: location.pathname.includes("/admin/concours"),
      },
      {
        name: "Orientation",
        href: "/admin/filieres",
        icon: UserGroupIcon,
        current: location.pathname.includes("/admin/filieres"),
      },
      {
        name: "Page d'accueil",
        href: "/",
        icon: ArrowLeftIcon,
        current: location.pathname === "/",
      },
    ],
    [location.pathname],
  );

  const handleSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

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

  const userInitials = useMemo(() => {
    if (!user) return "";
    return `${user.prenom?.charAt(0) || ""}${user.nom?.charAt(0) || ""}`;
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar pour mobile */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? "" : "hidden"}`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={handleSidebarClose}
        />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={handleSidebarClose}
              title="Fermer le panneau latéral"
              aria-label="Fermer le panneau latéral"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
              <span className="sr-only">Fermer</span>
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">AMAME ADMIN</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleSidebarClose}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                    item.current
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-4 flex-shrink-0 h-6 w-6 ${
                      item.current
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium">{userInitials}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.prenom || "Utilisateur"}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-sm font-bold text-red-500 hover:text-red-700"
                  disabled={isUserLoading}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar pour desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-gray-900">AMAME ADMIN</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    item.current
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      item.current
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium">{userInitials}</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">
                  {user?.prenom || "Utilisateur"}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-sm font-bold text-red-500 hover:text-red-700"
                  disabled={isUserLoading}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={handleSidebarToggle}
            title="Ouvrir le panneau latéral"
            aria-label="Ouvrir le panneau latéral"
          >
            <Bars3Icon className="h-6 w-6" />
            <span className="sr-only">Ouvrir</span>
          </button>
        </div>
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
